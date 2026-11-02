import { useLocalSearchParams } from 'expo-router';
import { TimeBlockMoveSheet } from '@/widgets/personal-time-flow';

export default function TimeBlockMoveScreen() {
  const { blockId } = useLocalSearchParams<{ blockId: string }>();
  return <TimeBlockMoveSheet blockId={blockId} />;
}
