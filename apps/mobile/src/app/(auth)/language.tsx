import { useRouter } from 'expo-router';
import { LanguageSheet } from '@/features/language-select';

export default function LanguageSheetScreen() {
  const router = useRouter();
  return <LanguageSheet onClose={() => router.back()} />;
}
