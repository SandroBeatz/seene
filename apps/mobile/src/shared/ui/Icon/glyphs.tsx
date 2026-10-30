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
  today: stroke(
    'regular',
    <>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>,
  ),
  menu: stroke(
    'regular',
    <>
      <Rect x={3.5} y={3.5} width={7} height={7} rx={2.2} />
      <Rect x={13.5} y={3.5} width={7} height={7} rx={2.2} />
      <Rect x={3.5} y={13.5} width={7} height={7} rx={2.2} />
      <Rect x={13.5} y={13.5} width={7} height={7} rx={2.2} />
    </>,
  ),
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
  note: stroke(
    'regular',
    <>
      <Path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" />
      <Path d="M8 8h8M8 11.5h5" />
    </>,
  ),
  blocked: stroke(
    'regular',
    <>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M6 18L18 6" />
    </>,
  ),
  unconfirmed: stroke(
    'medium',
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 11v5.5M12 7.5h.01" />
    </>,
  ),
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
  // Appointment preview (design "Запись · превью")
  more: {
    kind: 'fill',
    render: (color) => (
      <>
        <Circle cx={5} cy={12} r={1.2} fill={color} />
        <Circle cx={12} cy={12} r={1.2} fill={color} />
        <Circle cx={19} cy={12} r={1.2} fill={color} />
      </>
    ),
  },
  call: stroke(
    'regular',
    <Path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  ),
  services: stroke(
    'regular',
    <>
      <Circle cx={6.5} cy={7} r={2.5} />
      <Circle cx={6.5} cy={17} r={2.5} />
      <Path d="M8.6 8.4L20 17M8.6 15.6L20 7" />
    </>,
  ),
  noteCard: stroke(
    'regular',
    <>
      <Path d="M5 4h14v11l-5 5H5z" />
      <Path d="M14 20v-5h5M8.5 9h7M8.5 12.5h4" />
    </>,
  ),
  pencil: stroke(
    'regular',
    <>
      <Path d="M4 20h4L19 9l-4-4L4 16z" />
      <Path d="M13.5 6.5l4 4" />
    </>,
  ),
  reschedule: stroke(
    'regular',
    <>
      <Rect x={3.5} y={5} width={17} height={15.5} rx={3} />
      <Path d="M3.5 10h17M8 3v4M16 3v4M10 15h5M13 13l2 2-2 2" />
    </>,
  ),
  completeVisit: stroke('regular', <Path d="M2 12.5l4.5 4.5L16 7.5M11 16l1 1 9.5-9.5" />),
  cancelCircle: stroke(
    'regular',
    <>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M9 9l6 6M15 9l-6 6" />
    </>,
  ),
  noShow: stroke(
    'regular',
    <>
      <Circle cx={12} cy={8} r={3.5} />
      <Path d="M5 20c.8-3.5 3.6-5.5 7-5.5" />
      <Path d="M16 15l5 5M21 15l-5 5" />
    </>,
  ),
  repeat: stroke(
    'regular',
    <Path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5M4 20v-4.5h4.5" />,
  ),
  send: stroke(
    'regular',
    <>
      <Path d="M21 3L10 14" />
      <Path d="M21 3l-7 18-4-7-7-4z" />
    </>,
  ),
  trashBin: stroke(
    'regular',
    <>
      <Path d="M4 7h16M10 11v6M14 11v6" />
      <Path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </>,
  ),
  stop: {
    kind: 'fill',
    render: (color) => <Rect x={7} y={7} width={10} height={10} rx={2} fill={color} />,
  },
  lock: stroke(
    'regular',
    <>
      <Rect x={5} y={11} width={14} height={9} rx={2} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>,
  ),
  whatsapp: {
    kind: 'fill',
    render: () => (
      <Path
        fill={brandMarks.whatsapp}
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      />
    ),
  },
  // Telegram's paper plane, drawn in its brand blue (design "Новый клиент").
  telegram: {
    kind: 'fill',
    render: () => (
      <>
        <Path
          d="M21 4L3 11l6 2 2 6 3-4 5 4z"
          fill="none"
          stroke={brandMarks.telegram}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 13l12-9"
          fill="none"
          stroke={brandMarks.telegram}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  instagram: stroke(
    'regular',
    <>
      <Rect x={3} y={3} width={18} height={18} rx={5} />
      <Circle cx={12} cy={12} r={4} />
      <Circle cx={17.5} cy={6.5} r={0.6} />
    </>,
  ),
  // A phone handset outline: "Выбрать из контактов телефона".
  contacts: stroke(
    'regular',
    <>
      <Rect x={5} y={2.5} width={14} height={19} rx={3} />
      <Path d="M10 18h4" />
    </>,
  ),
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
