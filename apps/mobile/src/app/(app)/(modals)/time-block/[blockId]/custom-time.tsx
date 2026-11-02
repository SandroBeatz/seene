import { useLocalSearchParams } from 'expo-router';
import { PersonalTimeOwnTimeSheet } from '@/widgets/personal-time-flow';

export default function TimeBlockOwnTimeScreen() {
  const { blockId } = useLocalSearchParams<{ blockId: string }>();
  return <PersonalTimeOwnTimeSheet excludeId={blockId} />;
}
