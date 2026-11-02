/**
 * A day of the week strip (design "Календарь, день"). `WeekCalendar` doesn't repaint its
 * pages when only the markings change, so what a day shows comes through this context.
 */
import { createContext, memo, useContext } from 'react';
import { Pressable, View } from 'react-native';
import type { DateData } from 'react-native-calendars';
import { StyleSheet } from 'react-native-unistyles';
import { Text } from '@/shared/ui';

export const WEEK_HEIGHT = 50;

export interface WeekStripState {
  selected: string;
  todayKey: string;
  isOff: (dayKey: string) => boolean;
  hasVisits: (dayKey: string) => boolean;
  a11y: (dayKey: string) => string;
}

export const WeekStripContext = createContext<WeekStripState | null>(null);

interface WeekDayProps {
  date?: DateData;
  onPress?: (date: DateData) => void;
}

export const WeekDay = memo(function WeekDay({ date, onPress }: WeekDayProps) {
  const strip = useContext(WeekStripContext);
  if (!date || !strip) return null;
  const key = date.dateString;
  const on = key === strip.selected;
  const today = key === strip.todayKey;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={strip.a11y(key)}
      onPress={() => onPress?.(date)}
      style={styles.day}>
      <View style={[styles.circle, on && (today ? styles.onToday : styles.on)]}>
        <Text
          variant="callout"
          tabularNums
          color={on ? 'inverse' : strip.isOff(key) ? 'tertiary' : 'primary'}
          style={[(on || today) && styles.strong, !on && today && styles.todayText]}>
          {date.day}
        </Text>
      </View>
      <View style={[styles.dot, strip.hasVisits(key) && styles.dotOn]} />
    </Pressable>
  );
});

const styles = StyleSheet.create((theme) => ({
  day: {
    height: WEEK_HEIGHT,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  on: { backgroundColor: theme.colors.content.primary },
  onToday: { backgroundColor: theme.colors.brand.default },
  strong: { fontFamily: theme.typography.calloutStrong.fontFamily },
  todayText: { color: theme.colors.brand.default },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dotOn: { backgroundColor: theme.colors.content.tertiary },
}));
