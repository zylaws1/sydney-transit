import type {
  Departure,
  Stop,
  TransitClient,
  TransportLine,
  TransportMode,
  TripLeg,
  TripOption,
  TripTimeOptions,
} from '../types';
import { MockTransitClient } from './mockTransitClient';

const PROXY_BASE = '/api/tfnsw';

// Verified empirically against the live API (TfNSW's docs don't spell this
// out clearly): 1=train (incl. intercity), 2=metro, 4=lightrail, 5=bus,
// 7=coach, 9=ferry, 11=school bus, 99/100=walk.
const PRODUCT_CLASS_MODE: Record<number, TransportMode> = {
  1: 'train',
  2: 'metro',
  4: 'lightrail',
  5: 'bus',
  7: 'bus',
  9: 'ferry',
  11: 'bus',
};

const WALK_CLASSES = new Set([99, 100]);

function classToMode(productClass: number | undefined): TransportMode {
  return PRODUCT_CLASS_MODE[productClass ?? -1] ?? 'train';
}

function sydneyDateTimeParams(when: Date = new Date()): { itdDate: string; itdTime: string } {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(when);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    itdDate: `${get('year')}${get('month')}${get('day')}`,
    itdTime: `${get('hour')}${get('minute')}`,
  };
}

interface TfnswLocation {
  id: string;
  name?: string;
  disassembledName?: string;
  type: string;
  coord?: [number, number];
  modes?: number[];
  productClasses?: number[];
  properties?: Record<string, unknown>;
}

function platformFromProperties(properties: Record<string, unknown> | undefined): string | undefined {
  const name = properties?.platformName;
  if (typeof name !== 'string') return undefined;
  return name.replace(/^Platform\s*/i, '').trim() || undefined;
}

// Platform-level locations (trip leg origin/destination) carry a name like
// "Glenfield Station, Platform 2, Glenfield" - strip the platform segment
// (already shown separately via the dedicated platform field), and drop the
// trailing ", Suburb" when it's just the station name again (e.g.
// "Edmondson Park Station, Edmondson Park"), keeping it when it's actually
// informative (e.g. "Central Station, Sydney").
function cleanStopDisplayName(raw: string): string {
  const noPlatform = raw.replace(/,\s*Platform\s+\S+\s*,/i, ',').replace(/,\s*Platform\s+\S+\s*$/i, '');
  const parts = noPlatform.split(',').map((p) => p.trim());
  if (parts.length < 2) return noPlatform;
  const base = parts[0].replace(/\s+(Station|Wharf|Interchange)$/i, '').trim().toLowerCase();
  const suburb = parts[parts.length - 1].toLowerCase();
  return base === suburb ? parts[0] : parts.join(', ');
}

function locationName(loc: TfnswLocation): string {
  const withPlace = loc.properties?.STOP_NAME_WITH_PLACE;
  if (typeof withPlace === 'string') return cleanStopDisplayName(withPlace);
  if (loc.name && loc.name !== 'undefined, undefined') return cleanStopDisplayName(loc.name);
  return loc.disassembledName ?? 'Unknown stop';
}

function locationToStop(loc: TfnswLocation): Stop {
  const classes = loc.modes ?? loc.productClasses ?? [];
  const modes = Array.from(new Set(classes.map(classToMode)));
  return {
    id: loc.id,
    name: locationName(loc),
    modes: modes.length > 0 ? modes : ['train'],
    lat: loc.coord?.[0] ?? 0,
    lon: loc.coord?.[1] ?? 0,
  };
}

const stopCache = new Map<string, Stop>();

function cacheStop(stop: Stop): Stop {
  stopCache.set(stop.id, stop);
  return stop;
}

async function proxyGet(endpoint: string, params: Record<string, string>): Promise<any> {
  const search = new URLSearchParams({
    outputFormat: 'rapidJSON',
    coordOutputFormat: 'EPSG:4326',
    ...params,
  });
  const response = await fetch(`${PROXY_BASE}/${endpoint}?${search.toString()}`);
  if (!response.ok) {
    throw new Error(`TfNSW ${endpoint} request failed: ${response.status}`);
  }
  return response.json();
}

const REAL_ID_PATTERN = /^G?[0-9]+$/;

// stop_finder matches by name across the whole state, so a search like
// "Wynyard" also returns random bus stops on streets called Wynyard in
// Guildford, Rossmore, Tumut, etc. - each a legitimate "stop"-type result,
// easily outnumbering the one actual Wynyard Station match. Rank train/
// metro first, then light rail/ferry, then bus, so a named station always
// surfaces above incidental street-name bus stop matches.
const MODE_RANK: Record<TransportMode, number> = {
  train: 0,
  metro: 0,
  lightrail: 1,
  ferry: 1,
  bus: 2,
};

function stopRank(stop: Stop): number {
  return Math.min(...stop.modes.map((m) => MODE_RANK[m] ?? 2));
}

// Real client backed by Transport for NSW's Trip Planner API (via the
// /api/tfnsw proxy, see functions/api/tfnsw/[[path]].ts). The Trip Planner
// API is journey/stop-search oriented - it has no "list every station" or
// "list stops on line X" endpoint (that lives in the separate GTFS static
// feed), so getLines/stopsForLine/allStops fall back to the curated mock
// data for browsing, while search/nearby/departures/trip planning are real.
export class TfnswTransitClient implements TransitClient {
  private fallback = new MockTransitClient();

  async searchStops(query: string): Promise<Stop[]> {
    if (!query.trim()) return [];
    const data = await proxyGet('stop_finder', { type_sf: 'any', name_sf: query });
    const stops = (data.locations ?? [])
      .filter((loc: TfnswLocation) => loc.type === 'stop')
      .map((loc: TfnswLocation) => cacheStop(locationToStop(loc)));
    return stops.sort((a: Stop, b: Stop) => stopRank(a) - stopRank(b));
  }

  async nearbyStops(lat: number, lon: number): Promise<Stop[]> {
    const data = await proxyGet('coord', {
      coord: `${lon}:${lat}:EPSG:4326`,
      type_1: 'STOP',
      radius_1: '2000',
      inclFilter: '1',
    });
    return (data.locations ?? [])
      .filter((loc: TfnswLocation) => loc.type === 'stop')
      .slice(0, 6)
      .map((loc: TfnswLocation) => cacheStop(locationToStop(loc)));
  }

  async departures(stopId: string): Promise<Departure[]> {
    const { itdDate, itdTime } = sydneyDateTimeParams();
    const data = await proxyGet('departure_mon', {
      mode: 'direct',
      type_dm: 'stop',
      name_dm: stopId,
      depArrMacro: 'dep',
      itdDate,
      itdTime,
      TfNSWDM: 'true',
    });
    const now = Date.now();
    return (data.stopEvents ?? []).map((event: any, i: number): Departure => {
      const scheduled = event.departureTimePlanned as string;
      const estimated = (event.departureTimeEstimated as string | undefined) ?? scheduled;
      return {
        id: `${stopId}-${i}-${scheduled}`,
        stopId,
        mode: classToMode(event.transportation?.product?.class),
        line: event.transportation?.number ?? event.transportation?.disassembledName ?? 'Service',
        destination: event.transportation?.destination?.name ?? 'Unknown',
        scheduledTime: scheduled,
        estimatedTime: event.departureTimeEstimated as string | undefined,
        minutesUntil: Math.round((new Date(estimated).getTime() - now) / 60_000),
        cancelled: Boolean(event.isCancelled),
        platform: platformFromProperties(event.location?.properties),
      };
    });
  }

  async getStopsByIds(stopIds: string[]): Promise<Stop[]> {
    const results: Stop[] = [];
    for (const id of stopIds) {
      const cached = stopCache.get(id);
      if (cached) {
        results.push(cached);
        continue;
      }

      if (REAL_ID_PATTERN.test(id)) {
        const data = await proxyGet('stop_finder', { type_sf: 'stop', name_sf: id });
        const loc = (data.locations ?? []).find((l: TfnswLocation) => l.type === 'stop');
        if (loc) {
          results.push(cacheStop(locationToStop(loc)));
          continue;
        }
      }

      // Not a real TfNSW ID - probably a mock-data slug from the By Map /
      // By Train Line browsers, which still read the curated mock list.
      // Resolve it to a real stop by searching for its name instead.
      const [mockStop] = await this.fallback.getStopsByIds([id]);
      if (mockStop) {
        const [match] = await this.searchStops(mockStop.name);
        if (match) results.push(match);
      }
    }
    return results;
  }

  async getLines(): Promise<TransportLine[]> {
    return this.fallback.getLines();
  }

  async stopsForLine(lineId: string): Promise<Stop[]> {
    return this.fallback.stopsForLine(lineId);
  }

  async popularStops(): Promise<Stop[]> {
    const names = ['Central Station', 'Town Hall Station', 'Circular Quay', 'Wynyard Station'];
    const results = await Promise.all(names.map((name) => this.searchStops(name)));
    return results.map((r) => r[0]).filter((s): s is Stop => Boolean(s));
  }

  async allStops(): Promise<Stop[]> {
    // No "every station" endpoint here (that's GTFS static) - the map
    // picker uses the curated mock list, which has real names/approximate
    // coordinates for the whole network.
    return this.fallback.allStops();
  }

  private async fetchTripJourneys(
    fromStopId: string,
    toStopId: string,
    when: Date | undefined,
    arriveBy: boolean,
  ): Promise<TripOption[]> {
    const { itdDate, itdTime } = sydneyDateTimeParams(when);
    const data = await proxyGet('trip', {
      depArrMacro: arriveBy ? 'arr' : 'dep',
      itdDate,
      itdTime,
      type_origin: 'stop',
      name_origin: fromStopId,
      type_destination: 'stop',
      name_destination: toStopId,
      TfNSWTR: 'true',
    });

    const built = (data.journeys ?? []).map((journey: any): TripOption => {
      const transitLegs = (journey.legs ?? []).filter(
        (leg: any) => !WALK_CLASSES.has(leg.transportation?.product?.class),
      );
      const legs = transitLegs.map((leg: any) => buildLegFromRaw(leg));
      const totalSeconds = (journey.legs ?? []).reduce((sum: number, leg: any) => sum + (leg.duration ?? 0), 0);
      return buildTripOptionFromLegs(legs, Math.round(totalSeconds / 60));
    });

    // TfNSW's own response often repeats the identical journey twice
    // (same line, same departure, same stops) - collapse those.
    const seen = new Set<string>();
    return built.filter((option: TripOption) => {
      if (seen.has(option.id)) return false;
      seen.add(option.id);
      return true;
    });
  }

  // The single trip() query above sometimes prunes a real, usable journey
  // because its first leg's overall headsign direction doesn't "look"
  // like it's heading toward the destination - even when the specific stop
  // sequence does pass through a station that's already proven to be a
  // good interchange for this destination (verified against the live API:
  // a train toward "Blacktown" was excluded even though it stops at
  // Glenfield first, which a separately-returned journey already uses to
  // reach the same destination via a different line).
  //
  // Fix: look at the real, unfiltered departure board for the origin -
  // which never prunes anything - and for any departure the primary query
  // didn't already use, test whether it reaches the best interchange the
  // primary results found. If so, splice it onto that interchange's
  // onward leg(s) to build a new, genuinely valid option.
  private async augmentWithMissedDepartures(
    fromStopId: string,
    toStopId: string,
    primary: TripOption[],
    when: Date | undefined,
  ): Promise<TripOption[]> {
    const transferOptions = primary.filter((o) => o.legs.length >= 2);
    if (transferOptions.length === 0) return primary;

    const best = transferOptions.reduce((a, b) => (a.totalMinutes <= b.totalMinutes ? a : b));
    const hub = best.legs[0].toStop;

    const covered = new Set(primary.map((o) => `${o.legs[0]?.line}@${o.legs[0]?.departScheduled}`));

    const { itdDate, itdTime } = sydneyDateTimeParams(when);
    const departData = await proxyGet('departure_mon', {
      mode: 'direct',
      type_dm: 'stop',
      name_dm: fromStopId,
      depArrMacro: 'dep',
      itdDate,
      itdTime,
      TfNSWDM: 'true',
    });
    const candidates = (departData.stopEvents ?? [])
      .filter((event: any) => !WALK_CLASSES.has(event.transportation?.product?.class))
      .filter((event: any) => !covered.has(`${event.transportation?.number}@${event.departureTimePlanned}`))
      .slice(0, 8);

    const extra: TripOption[] = [];
    for (const event of candidates) {
      const candidateTime = new Date(event.departureTimePlanned as string);
      const { itdDate: hd, itdTime: ht } = sydneyDateTimeParams(candidateTime);
      const hubData = await proxyGet('trip', {
        depArrMacro: 'dep',
        itdDate: hd,
        itdTime: ht,
        type_origin: 'stop',
        name_origin: fromStopId,
        type_destination: 'stop',
        name_destination: hub.id,
        TfNSWTR: 'true',
      });

      // departure_mon and trip() occasionally report the same physical
      // service a few seconds apart (observed: a 30s discrepancy for an
      // identical service) - match within a tolerance window, not exactly.
      const directHop = (hubData.journeys ?? []).find((j: any) => {
        const legs = (j.legs ?? []).filter((l: any) => !WALK_CLASSES.has(l.transportation?.product?.class));
        if (legs.length !== 1) return false;
        const legMs = new Date(legs[0].origin.departureTimePlanned).getTime();
        return Math.abs(legMs - candidateTime.getTime()) <= 90_000;
      });
      if (!directHop) continue;

      const firstLeg = buildLegFromRaw(
        directHop.legs.filter((l: any) => !WALK_CLASSES.has(l.transportation?.product?.class))[0],
      );

      // Don't reuse the original continuation's fixed times - this new
      // first leg arrives at the hub at a different moment, so re-query
      // the onward journey fresh, timed off its actual arrival (plus a
      // minimum connection buffer).
      const arriveAtHub = new Date(firstLeg.arriveEstimated).getTime();
      const { itdDate: cd, itdTime: ct } = sydneyDateTimeParams(new Date(arriveAtHub + 2 * 60_000));
      const continuationData = await proxyGet('trip', {
        depArrMacro: 'dep',
        itdDate: cd,
        itdTime: ct,
        type_origin: 'stop',
        name_origin: hub.id,
        type_destination: 'stop',
        name_destination: toStopId,
        TfNSWTR: 'true',
      });
      const bestContinuation = (continuationData.journeys ?? [])[0];
      if (!bestContinuation) continue;
      const continuation = (bestContinuation.legs ?? [])
        .filter((l: any) => !WALK_CLASSES.has(l.transportation?.product?.class))
        .map((l: any) => buildLegFromRaw(l));
      if (continuation.length === 0) continue;

      extra.push(buildTripOptionFromLegs([firstLeg, ...continuation]));
    }

    const merged = [...primary, ...extra];
    const seen = new Set<string>();
    const deduped = merged.filter((o) => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
    return deduped.sort((a, b) => new Date(a.departEstimated).getTime() - new Date(b.departEstimated).getTime());
  }

  async planTrip(fromStopId: string, toStopId: string, options?: TripTimeOptions): Promise<TripOption[]> {
    const primary = await this.fetchTripJourneys(fromStopId, toStopId, options?.when, options?.arriveBy ?? false);
    if (options?.arriveBy) return primary; // augmentation assumes "depart after"; out of scope for arrive-by
    return this.augmentWithMissedDepartures(fromStopId, toStopId, primary, options?.when);
  }
}

function buildLegFromRaw(leg: any): TripLeg {
  const origin = leg.origin;
  const destination = leg.destination;
  return {
    mode: classToMode(leg.transportation?.product?.class),
    line: leg.transportation?.number ?? leg.transportation?.disassembledName ?? 'Service',
    fromStop: locationToStop(origin),
    toStop: locationToStop(destination),
    departScheduled: origin.departureTimePlanned,
    departEstimated: origin.departureTimeEstimated ?? origin.departureTimePlanned,
    arriveScheduled: destination.arrivalTimePlanned,
    arriveEstimated: destination.arrivalTimeEstimated ?? destination.arrivalTimePlanned,
    cancelled: Boolean(leg.properties?.isCancelled),
    platform: platformFromProperties(origin.properties),
    arrivalPlatform: platformFromProperties(destination.properties),
  };
}

function buildTripOptionFromLegs(legs: TripLeg[], totalMinutesOverride?: number): TripOption {
  const first = legs[0];
  const last = legs[legs.length - 1];
  // Stable id (not an array index) so pages fetched later for "show later
  // trips", or options spliced together from a departure board + a known
  // interchange, dedupe correctly against ones already shown.
  const id = legs.map((l) => `${l.line}@${l.departScheduled}`).join('|') || `trip-${first?.departScheduled}`;
  const totalMinutes =
    totalMinutesOverride ??
    Math.round((new Date(last.arriveEstimated).getTime() - new Date(first.departEstimated).getTime()) / 60_000);

  return {
    id,
    legs,
    departScheduled: first?.departScheduled ?? '',
    departEstimated: first?.departEstimated ?? '',
    arriveScheduled: last?.arriveScheduled ?? '',
    arriveEstimated: last?.arriveEstimated ?? '',
    totalMinutes,
  };
}
