/**
 * Live ModalLayout showcase as an Expo Router route modal (linked from the UI kit
 * gallery). Demonstrates the ✕ close slot, centered static title, edge-fade scrim, and
 * in-flow footer actions. See docs/design-system.md §4.2.
 */
import { useRouter } from 'expo-router';
import { Button, Card, ModalLayout, Text } from '@/shared/ui';

export default function ModalLayoutDemo() {
  const router = useRouter();

  return (
    <ModalLayout
      title="Sign in"
      variant="modal"
      onClose={() => router.back()}
      footer={
        <>
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          <Button label="Continue" onPress={() => router.back()} />
        </>
      }>
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <Text variant="body">Modal row {i + 1}</Text>
          <Text variant="subhead" color="secondary">
            Route modal: ✕ closes it, the footer holds the actions.
          </Text>
        </Card>
      ))}
    </ModalLayout>
  );
}
