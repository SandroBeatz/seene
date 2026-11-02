import { useLocalSearchParams } from 'expo-router';
import { TimeBlockPreview } from '@/widgets/personal-time-flow';

export default function TimeBlockPreviewScreen() {
  const { blockId } = useLocalSearchParams<{ blockId: string }>();
  return <TimeBlockPreview blockId={blockId} />;
}
