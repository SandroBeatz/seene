/** Nested modal route: router.back() pops to the modal entry screen. */
import { useRouter } from 'expo-router';
import { Button, Card, IconButton, ModalLayout, Text } from '@/shared/ui';

export default function ModalLayoutDetailsDemo() {
  const router = useRouter();

  return (
    <ModalLayout
      title="Nested route"
      headerLeft={
        <IconButton
          icon="chevronLeft"
          accessibilityLabel="Back"
          variant="glass"
          onPress={() => router.back()}
        />
      }
      footer={<Button label="Back to modal" onPress={() => router.back()} />}>
      <Card>
        <Text variant="title2">Second modal screen</Text>
        <Text variant="body" color="secondary">
          This screen was pushed inside the modal navigator. Back pops only this route; the outer
          modal remains presented.
        </Text>
      </Card>
    </ModalLayout>
  );
}
