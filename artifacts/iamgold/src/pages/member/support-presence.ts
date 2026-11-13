import type { SupportPresenceState } from '@workspace/api-client-react';

export type SampledSupportPresence = {
  value: SupportPresenceState;
  expiresAtPerformanceTime: number | null;
};

export function sampleSupportPresence(
  value: SupportPresenceState,
  sampledAt = performance.now(),
): SampledSupportPresence {
  const serverTime = Date.parse(value.serverNow);
  const onlineUntil = value.presence.onlineUntil ? Date.parse(value.presence.onlineUntil) : Number.NaN;
  const remaining = onlineUntil - serverTime;
  return {
    value,
    expiresAtPerformanceTime:
      value.presence.online && Number.isFinite(remaining) && remaining > 0
        ? sampledAt + remaining
        : null,
  };
}

export function isSupportPresenceOnline(
  sample: SampledSupportPresence | null,
  now = performance.now(),
): boolean {
  return Boolean(
    sample?.value.presence.online &&
    sample.expiresAtPerformanceTime !== null &&
    now < sample.expiresAtPerformanceTime,
  );
}

export function formatSupportPresenceTime(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return '';
  return timestamp.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
