import { describe, expect, it } from '@jest/globals';
import { servicePalette } from '@/shared/theme/tokens';
import { contrastRatio, eventSwatch, hexToRgb } from './index';

describe('hexToRgb', () => {
  it('parses with and without #', () => {
    expect(hexToRgb('#CF3767')).toEqual({ r: 207, g: 55, b: 103 });
    expect(hexToRgb('cf3767')).toEqual({ r: 207, g: 55, b: 103 });
  });

  it('rejects malformed input', () => {
    expect(() => hexToRgb('#FFF')).toThrow();
    expect(() => hexToRgb('red')).toThrow();
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for equal colours', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrastRatio('#E9A5B5', '#E9A5B5')).toBe(1);
  });
});

describe('eventSwatch', () => {
  it('keeps the service colour as the bar', () => {
    expect(eventSwatch('#e9a5b5').bar).toBe('#E9A5B5');
  });

  it('tints the light fill close to the design (manicure → #FBEDF0)', () => {
    expect(eventSwatch(servicePalette.powder).fill).toBe('#FBEDF0');
  });

  const colors = Object.entries(servicePalette);

  it.each(colors)('%s: accent text is readable on its fill in both schemes', (_key, hex) => {
    for (const scheme of ['light', 'dark'] as const) {
      const swatch = eventSwatch(hex, scheme);
      expect(contrastRatio(swatch.text, swatch.fill)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(colors)('%s: light fill stays light, dark fill stays dark', (_key, hex) => {
    expect(contrastRatio(eventSwatch(hex, 'light').fill, '#FFFFFF')).toBeLessThan(1.35);
    expect(contrastRatio(eventSwatch(hex, 'dark').fill, '#0B0B0C')).toBeLessThan(2);
  });
});
