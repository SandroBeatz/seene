import { useLocalSearchParams } from 'expo-router';
import { TimeBlockNameSheet } from '@/widgets/personal-time-flow';

export default function TimeBlockNameScreen() {
  const { blockId } = useLocalSearchParams<{ blockId: string }>();
  return <TimeBlockNameSheet blockId={blockId} />;
}
