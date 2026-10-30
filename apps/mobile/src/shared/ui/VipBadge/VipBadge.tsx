/**
 * The VIP mark next to a client's name (design: list, profile, appointment): a
 * gradient outline pill with gradient "VIP" letters.
 */
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useUnistyles } from 'react-native-unistyles';

const VIP = { width: 28, height: 14 };

export interface VipBadgeProps {
  /** Spoken label ("VIP-клиент"). */
  accessibilityLabel: string;
}

export function VipBadge({ accessibilityLabel }: VipBadgeProps) {
  const { theme } = useUnistyles();
  const [from, mid, to] = theme.colors.vip;
  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <Svg width={VIP.width} height={VIP.height}>
        <Defs>
          <LinearGradient id="vip" x1="0" y1="0" x2="1" y2="0.6">
            <Stop offset="0" stopColor={from} />
            <Stop offset="0.55" stopColor={mid} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect
          x={0.5}
          y={0.5}
          width={VIP.width - 1}
          height={VIP.height - 1}
          rx={(VIP.height - 1) / 2}
          fill="none"
          stroke="url(#vip)"
        />
        <SvgText
          x={VIP.width / 2}
          y={10}
          fontSize={8}
          fontWeight="600"
          letterSpacing={1}
          textAnchor="middle"
          fill="url(#vip)">
          VIP
        </SvgText>
      </Svg>
    </View>
  );
}
