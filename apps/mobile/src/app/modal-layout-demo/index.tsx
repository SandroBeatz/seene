/**
 * Route-modal entry screen. The root Stack presents this directory as a modal;
 * the Link below pushes a second screen on the nested Stack without dismissing it.
 */
import { Link, useRouter } from 'expo-router';
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
          <Button label="Continue" onPress={() => router.push('/modal-layout-demo/details')} />
        </>
      }>
      <Card>
        <Text variant="title3">Routing inside a modal</Text>
        <Text variant="subhead" color="secondary">
          The modal owns a nested Stack. Opening the next route keeps the modal card on screen.
        </Text>
        <Link href="/modal-layout-demo/details" asChild>
          <Button label="Open nested route" variant="secondary" />
        </Link>
      </Card>

      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <Text variant="body">Modal row {i + 1}</Text>
          <Text variant="subhead" color="secondary">
            Scroll content dissolves through the full modal header.
          </Text>
        </Card>
      ))}
    </ModalLayout>
  );
}
