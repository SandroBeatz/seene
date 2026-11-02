import { useLocalSearchParams } from 'expo-router';
import { PersonalTimeMonthSheet } from '@/widgets/personal-time-flow';

export default function TimeBlockMonthScreen() {
  const { blockId } = useLocalSearchParams<{ blockId: string }>();
  return <PersonalTimeMonthSheet excludeId={blockId} />;
}
