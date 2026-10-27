/**
 * Glyph registry for the Icon facade. 24-unit viewBox line icons; paths for the
 * onboarding set are copied 1:1 from the design so they render identically on iOS
 * and Android. Each glyph declares its default stroke weight from the design.
 */
import type { ReactNode } from 'react';
import { Circle, Path, Polygon, Rect } from 'react-native-svg';
import { brandMarks, type iconStroke } from '@/shared/theme/tokens';

export type IconWeight = keyof typeof iconStroke;

interface StrokeGlyph {
  kind: 'stroke';
  weight: IconWeight;
  body: ReactNode;
}

interface FillGlyph {
  kind: 'fill';
  /** Receives the resolved colour; multicolour marks ignore it. */
  render: (color: string) => ReactNode;
}

export type Glyph = StrokeGlyph | FillGlyph;

const stroke = (weight: IconWeight, body: ReactNode): StrokeGlyph => ({
  kind: 'stroke',
  weight,
  body,
});

export const GLYPHS = {
  // Navigation
  chevronLeft: stroke('medium', <Path d="M15 6l-6 6 6 6" />),
  chevronRight: stroke('regular', <Path d="M9 6l6 6-6 6" />),
  chevronDown: stroke('regular', <Path d="M6 9l6 6 6-6" />),
  close: stroke('bold', <Path d="M6 6l12 12M18 6L6 18" />),
  check: stroke('black', <Path d="M5 12.5l4.5 4.5L19 7.5" />),
  add: stroke('medium', <Path d="M12 5v14M5 12h14" />),
  search: stroke(
    'regular',
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="M20 20l-3.5-3.5" />
    </>,
  ),
  globe: stroke(
    'light',
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </>,
  ),
  // Tabs & header
  home: stroke('regular', <Path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />),
  calendar: stroke(
    'regular',
    <>
      <Rect x={3.5} y={5} width={17} height={15.5} rx={3} />
      <Path d="M3.5 10h17M8 3v4M16 3v4" />
    </>,
  ),
  clients: stroke(
    'regular',
    <>
      <Circle cx={9} cy={8.5} r={3.5} />
      <Path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
      <Path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M18 14.8c1.8.8 3 2.6 3.5 5.2" />
    </>,
  ),
  analytics: stroke('regular', <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />),
  bell: stroke(
    'regular',
    <>
      <Path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
      <Path d="M10 20a2 2 0 0 0 4 0" />
    </>,
  ),
  settings: stroke(
    'regular',
    <>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>,
  ),
  // Content
  chat: stroke('medium', <Path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" />),
  link: stroke(
    'bold',
    <>
      <Path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <Path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>,
  ),
  tag: stroke(
    'regular',
    <>
      <Path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
      <Circle cx={7.5} cy={7.5} r={1.5} />
    </>,
  ),
  user: stroke(
    'regular',
    <>
      <Circle cx={12} cy={9} r={3.5} />
      <Path d="M5 20c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
    </>,
  ),
  userAdd: stroke(
    'regular',
    <>
      <Circle cx={9} cy={8} r={3.5} />
      <Path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
      <Path d="M19 8v6M16 11h6" />
    </>,
  ),
  userCircle: stroke(
    'regular',
    <>
      <Circle cx={12} cy={12} r={9} />
      <Circle cx={12} cy={10} r={3} />
      <Path d="M6.5 18.5c1.2-2.2 3.2-3.3 5.5-3.3s4.3 1.1 5.5 3.3" />
    </>,
  ),
  image: stroke(
    'regular',
    <>
      <Rect x={3} y={5} width={18} height={14} rx={3} />
      <Circle cx={9} cy={10} r={1.6} />
      <Path d="M21 16l-5-5-8 8" />
    </>,
  ),
  text: stroke('regular', <Path d="M5 6h14M5 11h14M5 16h9" />),
  mapPin: stroke(
    'regular',
    <>
      <Path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
      <Circle cx={12} cy={10} r={2.3} />
    </>,
  ),
  clock: stroke(
    'regular',
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>,
  ),
  coffee: stroke(
    'regular',
    <>
      <Path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <Path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <Path d="M7 2v3M11 2v3" />
    </>,
  ),
  edit: stroke(
    'regular',
    <>
      <Path d="M12 20h9" />
      <Path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </>,
  ),
  trash: stroke('regular', <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />),
  phone: stroke(
    'regular',
    <Path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
  ),
  starOutline: stroke(
    'regular',
    <Polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" />,
  ),
  warning: stroke(
    'regular',
    <>
      <Path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <Path d="M12 9v4M12 17h.01" />
    </>,
  ),
  info: stroke(
    'regular',
    <>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 16v-4M12 8h.01" />
    </>,
  ),
  error: stroke(
    'regular',
    <>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 8v4M12 16h.01" />
    </>,
  ),
  empty: stroke(
    'regular',
    <>
      <Path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <Path d="M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z" />
    </>,
  ),
  wifiOff: stroke(
    'regular',
    <>
      <Path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.6M10.7 5c4-.4 8.1.9 11.3 3.8M16.9 11.3a10 10 0 0 1 2.2 1.6M5 13a10 10 0 0 1 5.2-2.8" />
      <Path d="M12 20h.01" />
    </>,
  ),
  // Filled & brand marks
  star: {
    kind: 'fill',
    render: (color) => (
      <Polygon
        fill={color}
        points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2"
      />
    ),
  },
  verified: {
    kind: 'fill',
    render: (color) => (
      <>
        <Circle cx={12} cy={12} r={10} fill={color} />
        <Path
          d="M7.5 12.5l3 3 6-6.5"
          fill="none"
          stroke="white"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  apple: {
    kind: 'fill',
    render: (color) => (
      <Path
        fill={color}
        d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.9-1.1-2.9-4.2zM13.9 5.3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z"
      />
    ),
  },
  google: {
    kind: 'fill',
    render: () => (
      <>
        <Path
          fill={brandMarks.google.blue}
          d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"
        />
        <Path
          fill={brandMarks.google.green}
          d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
        />
        <Path
          fill={brandMarks.google.yellow}
          d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z"
        />
        <Path
          fill={brandMarks.google.red}
          d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5L6.4 10C7.2 7.8 9.4 6 12 6z"
        />
      </>
    ),
  },
} satisfies Record<string, Glyph>;

export type IconName = keyof typeof GLYPHS;
