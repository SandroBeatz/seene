import { useLocalSearchParams } from 'expo-router';
import { CalendarDayScreen } from '@/widgets/calendar';

export default function CalendarDayRoute() {
  const { date } = useLocalSearchParams<{ date: string }>();
  return <CalendarDayScreen key={date} initialDate={date} />;
}
