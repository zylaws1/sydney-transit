export type TransportMode = 'train' | 'bus' | 'ferry' | 'lightrail' | 'metro';

export interface Stop {
  id: string;
  name: string;
  modes: TransportMode[];
  lat: number;
  lon: number;
}

export interface Departure {
  id: string;
  stopId: string;
  mode: TransportMode;
  line: string;
  destination: string;
  /** ISO timestamp of the scheduled departure */
  scheduledTime: string;
  /** ISO timestamp of the realtime-estimated departure, if known */
  estimatedTime?: string;
  /** minutes until estimated/scheduled departure */
  minutesUntil: number;
  cancelled?: boolean;
  platform?: string;
}

export interface TransportLine {
  id: string;
  mode: TransportMode;
  name: string;
}

export interface TripLeg {
  mode: TransportMode;
  line: string;
  fromStop: Stop;
  toStop: Stop;
  departScheduled: string;
  departEstimated: string;
  arriveScheduled: string;
  arriveEstimated: string;
  cancelled?: boolean;
  /** Platform this leg boards from. */
  platform?: string;
  /** Platform this leg arrives at (may differ from the next leg's boarding platform). */
  arrivalPlatform?: string;
}

export interface TripOption {
  id: string;
  legs: TripLeg[];
  departScheduled: string;
  departEstimated: string;
  arriveScheduled: string;
  arriveEstimated: string;
  totalMinutes: number;
}

export interface TripTimeOptions {
  /** When to depart (default) or arrive. Omit to mean "now". */
  when?: Date;
  /** If true, `when` is the desired arrival time instead of departure time. */
  arriveBy?: boolean;
}

export interface TransitClient {
  searchStops(query: string): Promise<Stop[]>;
  nearbyStops(lat: number, lon: number): Promise<Stop[]>;
  departures(stopId: string): Promise<Departure[]>;
  getStopsByIds(stopIds: string[]): Promise<Stop[]>;
  getLines(): Promise<TransportLine[]>;
  stopsForLine(lineId: string): Promise<Stop[]>;
  popularStops(): Promise<Stop[]>;
  planTrip(fromStopId: string, toStopId: string, options?: TripTimeOptions): Promise<TripOption[]>;
  allStops(): Promise<Stop[]>;
}
