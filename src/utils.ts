export function filterByName<T extends { name: string }>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export type RunStatus = 'cancelled' | 'delayed' | 'on-time';

export function getRunStatus(scheduled: string, estimated: string, cancelled?: boolean): RunStatus {
  if (cancelled) return 'cancelled';
  return new Date(estimated).getTime() > new Date(scheduled).getTime() ? 'delayed' : 'on-time';
}

export function delayMinutes(scheduled: string, estimated: string): number {
  return Math.round((new Date(estimated).getTime() - new Date(scheduled).getTime()) / 60_000);
}
