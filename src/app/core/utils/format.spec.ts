import { describe, expect, it } from 'vitest';
import { fmtTime, toSeconds } from './format';

describe('toSeconds', () => {
  it('parses "m:ss"', () => {
    expect(toSeconds('3:45')).toBe(225);
    expect(toSeconds('0:09')).toBe(9);
  });

  it('parses "h:mm:ss"', () => {
    expect(toSeconds('1:02:03')).toBe(3723);
  });

  it('returns 0 for malformed input', () => {
    expect(toSeconds('')).toBe(0);
    expect(toSeconds('12')).toBe(0);
  });
});

describe('fmtTime', () => {
  it('formats seconds as "m:ss" with zero-padding', () => {
    expect(fmtTime(225)).toBe('3:45');
    expect(fmtTime(9)).toBe('0:09');
    expect(fmtTime(0)).toBe('0:00');
  });

  it('floors fractional seconds', () => {
    expect(fmtTime(65.9)).toBe('1:05');
  });

  it('round-trips with toSeconds', () => {
    expect(fmtTime(toSeconds('4:07'))).toBe('4:07');
  });
});
