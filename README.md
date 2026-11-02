# Sydney Transit PWA

A TripView-style installable web app for Sydney public transport: browse
stations (by name, by line, on a map, by location, or favorites), see
real-time departures with platform/status info, and plan A→B trips.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173 - real TfNSW data if .dev.vars has a key, otherwise errors on data calls
npm run build    # production build + service worker in dist/
npm run preview  # serve the production build locally
npm run deploy   # build + deploy to Cloudflare Pages
```

Install as an app: open the dev/preview URL in Chrome/Edge/Safari and use
"Add to Home Screen" / the install icon in the address bar.

## Real-time data (Transport for NSW)

The app is wired to **Transport for NSW's Trip Planner API** by default
(`src/data/tfnswTransitClient.ts`). You need a free API key:

1. Sign up at the [Open Data Hub](https://opendata.transport.nsw.gov.au/) and
   grab an API key (instant, free).
2. Put it in a `.dev.vars` file at the project root (gitignored — never
   commit this):
   ```
   TFNSW_API_KEY=<your key>
   ```
3. Run `npm run dev`. A Vite dev-server middleware (`tfnswDevProxyPlugin` in
   `vite.config.ts`) proxies `/api/tfnsw/*` to TfNSW's API with the key
   attached server-side — the key never reaches the browser bundle.

To force the offline fixture data instead (e.g. demoing without a key), set
`VITE_USE_MOCK_DATA=true` in your environment before running `npm run dev`.

### Production: Cloudflare Pages Function

The dev middleware is **local-dev only**. In production the exact same job
is done by `functions/api/tfnsw/[[path]].ts`, a Cloudflare Pages Function —
deploy with `npm run deploy` (or connect the repo in the Cloudflare
dashboard), then add `TFNSW_API_KEY` as an **encrypted** environment
variable in the Pages project settings. That's a dashboard step only you can
do; I can't set secrets on your Cloudflare account.

> Note: if your machine's security policy blocks the Cloudflare Workers
> local runtime (`wrangler pages dev` crashing with `write EPIPE` is the
> symptom), that's why local dev uses the Vite middleware instead of
> `wrangler` — the Cloudflare Function itself still works fine once deployed
> to Cloudflare's own servers.

### What's real vs. mock, even in "real" mode

The Trip Planner API is journey/stop-search oriented — it has **no "list
every station" or "list stops on line X" endpoint** (that lives in a
separate GTFS static feed TfNSW also publishes, not yet integrated). So:

- **Real, live data**: search by name, nearby stations, departures
  (platform, delay, cancellation), trip planning (direct + transfer
  journeys, real stopping patterns).
- **Still the curated mock list**: the "By Train Line" browser and the "By
  Map" marker set. Selecting a station from either re-resolves it to a real
  TfNSW stop by name before fetching departures, so this is just a browsing
  gap, not a data-correctness one.

## Architecture

- `src/types.ts` — `Stop`, `Departure`, `TransportLine`, `TripOption`, and
  the `TransitClient` interface every data source implements.
- `src/data/tfnswTransitClient.ts` — the real client, calling `/api/tfnsw/*`.
- `src/data/mockTransitClient.ts` — offline fixture data (full T1–T9 network,
  hand-curated), used when `VITE_USE_MOCK_DATA=true` and as the fallback for
  line/map browsing above.
- `src/data/transitClient.ts` — the single place the app picks its data
  source. Nothing else imports a concrete client directly.
- `functions/api/tfnsw/[[path]].ts` — the production proxy (Cloudflare Pages
  Function). `vite.config.ts`'s `tfnswDevProxyPlugin` is its local-dev
  equivalent.
- `src/hooks/` — `useGeolocation`, `useFavorites`, `useSubscription` (all
  `localStorage`-backed; see below).
- `src/components/` — `HomeMenu` (entry point), `NearbyStops`, `SearchStops`,
  `ByLine`, `StopMapPicker`, `PopularStops`, `Favorites`, `DeparturesList`,
  `TripPlanner`, `StopSelectorSheet` (the From/To picker, reusing the same
  browse screens), `GoPremium`/`AdBanner`.
- `vite.config.ts` — `vite-plugin-pwa` (manifest + service worker) plus the
  dev-only TfNSW proxy middleware.

## Commercial groundwork (prototype only, not wired to real billing)

`useSubscription` is a `localStorage` flag toggled by the `GoPremium` screen
— it demonstrates the free-with-ads / $2.99-month / $19.99-year paywall UX,
but **it is not secure gating**: anyone can flip it in devtools. Before this
means anything commercially it needs:
- A real account system (e.g. Supabase Auth) so favorites/subscription
  status are tied to a user, not a browser.
- Real billing (Stripe) with subscription status checked server-side, never
  trusted from the client.

## Ads (Google AdSense)

Free-tier users see an ad slot on the departures screen (`AdSenseUnit`,
`src/components/AdSenseUnit.tsx`). Right now it falls back to a local demo
placeholder (`AdBanner`) — to make it a real, revenue-generating ad:

1. **Deploy the site to a real domain first** (`npm run deploy` or connect
   the repo in the Cloudflare dashboard) — AdSense won't review a localhost
   site.
2. Apply at [Google AdSense](https://www.google.com/adsense/) with that
   domain. Approval needs real content/traffic and can take days; this is a
   step only you can do (it's tied to your Google account and, once
   monetised, your bank details).
3. Once approved, create an ad unit and get your **publisher ID**
   (`ca-pub-...`) and that unit's **slot ID**.
4. Set `VITE_ADSENSE_CLIENT_ID` and `VITE_ADSENSE_SLOT_ID` as environment
   variables (locally in `.env.local`, and in the Cloudflare Pages project
   settings for production) — `AdSenseUnit` automatically renders the real
   ad once both are present, no code changes needed.
5. Replace `public/ads.txt`'s placeholder content with the exact line
   AdSense gives you.

AdSense approval also generally expects a visible privacy policy — see
`src/components/PrivacyPolicyScreen.tsx` (reachable from Settings → About →
Privacy Policy), which already discloses the AdSense/third-party-cookie
usage. Update its "Contact" section with real details before actually
applying.

Realistic expectations: ad revenue for a utility app like this is small
until you have real scale (see the numbers discussed when this was built —
tens of dollars/month at hundreds of users, hundreds/month at ~10k). Treat
it as the free-tier lever that makes Premium's "remove ads" meaningful, not
a primary revenue plan on its own.

## What's intentionally out of scope

- Native home-screen widgets — not possible from a PWA; would need a thin
  native wrapper (React Native/Capacitor) later if this becomes valuable
  enough to justify it.
- GTFS static integration (full line/station browsing with real data,
  rather than the curated mock list).
