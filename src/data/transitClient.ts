import type { TransitClient } from '../types';
import { MockTransitClient } from './mockTransitClient';
import { TfnswTransitClient } from './tfnswTransitClient';

// Defaults to real TfNSW data (via the /api/tfnsw proxy - see
// functions/api/tfnsw/[[path]].ts and README.md). Set VITE_USE_MOCK_DATA=true
// to force the offline mock client instead (e.g. plain `npm run dev` without
// `wrangler pages dev`, where the proxy function isn't served).
export const transitClient: TransitClient =
  import.meta.env.VITE_USE_MOCK_DATA === 'true' ? new MockTransitClient() : new TfnswTransitClient();
