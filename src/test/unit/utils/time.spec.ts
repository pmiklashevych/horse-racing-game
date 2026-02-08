import { describe, expect, it } from 'vitest';
import { formatDurationMs, formatRaceId } from '@/utils/time';

describe('time utils', () => {
  it('formats race id as YYYYMMDD_HHMMSS', () => {
    const date = new Date('2026-02-08T21:17:18');
    expect(formatRaceId(date)).toBe('20260208_211718');
  });

  it('formats duration in mm:ss:ms', () => {
    expect(formatDurationMs(0)).toBe('00:00:000');
    expect(formatDurationMs(12345)).toBe('00:12:345');
    expect(formatDurationMs(75432)).toBe('01:15:432');
    expect(formatDurationMs(Number.NaN)).toBe('--:--:---');
  });
});
