import { describe, expect, it } from '@jest/globals';
import { contrastRatio } from '@/shared/lib/color';
import { darkTheme, lightTheme } from './themes';

const TONES = ['neutral', 'brand', 'warning', 'success', 'danger', 'muted', 'info'] as const;

describe('status tones', () => {
  it.each(TONES)('%s: pill text is readable in both themes', (tone) => {
    for (const theme of [lightTheme, darkTheme]) {
      const { fg, bg } = theme.colors.tone[tone];
      expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
      // Attention cards put the same text on the plain canvas.
      expect(contrastRatio(fg, theme.colors.bg.canvas)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
