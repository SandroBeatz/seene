/**
 * UI kit gallery — renders every primitive in the active theme and its states.
 * Living documentation + a visual-regression surface (docs/design-system.md §8).
 */
import { useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import type { AppointmentStatusColorKey } from '@/shared/theme/tokens';
import {
  Badge,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  Footer,
  Icon,
  IconButton,
  Input,
  ListItem,
  Modal,
  ModalLayout,
  Screen,
  Sheet,
  Skeleton,
  SkeletonList,
  StatusPill,
  Switch,
  Text,
} from '@/shared/ui';

const STATUSES: AppointmentStatusColorKey[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'expired',
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="title3">{title}</Text>
      {children}
    </View>
  );
}

export default function UiGuideScreen() {
  const [switchOn, setSwitchOn] = useState(true);
  const [chip, setChip] = useState('a');
  const [modalOpen, setModalOpen] = useState(false);
  const sheetRef = useRef<BottomSheetModal>(null);
  const layoutSheetRef = useRef<BottomSheetModal>(null);

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ headerShown: true, title: 'UI Kit' }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title="Typography">
          <Text variant="display">Display</Text>
          <Text variant="title1">Title 1</Text>
          <Text variant="title3">Title 3</Text>
          <Text variant="body">Body — the default paragraph text.</Text>
          <Text variant="subhead" color="secondary">
            Subhead secondary
          </Text>
          <Text variant="caption" color="tertiary">
            Caption tertiary
          </Text>
        </Section>

        <Section title="Buttons">
          <View style={styles.row}>
            <Button label="Primary" onPress={() => {}} />
            <Button label="Secondary" variant="secondary" onPress={() => {}} />
          </View>
          <View style={styles.row}>
            <Button label="Ghost" variant="ghost" onPress={() => {}} />
            <Button label="Danger" variant="danger" onPress={() => {}} />
          </View>
          <View style={styles.row}>
            <Button label="Loading" loading onPress={() => {}} />
            <Button label="Disabled" disabled onPress={() => {}} />
            <Button label="Icon" leftIcon="add" onPress={() => {}} />
          </View>
        </Section>

        <Section title="Icon buttons">
          <View style={styles.row}>
            <IconButton icon="add" accessibilityLabel="Add" variant="accent" onPress={() => {}} />
            <IconButton icon="edit" accessibilityLabel="Edit" onPress={() => {}} />
            <IconButton icon="trash" accessibilityLabel="Delete" variant="danger" onPress={() => {}} />
            <IconButton icon="search" accessibilityLabel="Search" variant="ghost" onPress={() => {}} />
          </View>
        </Section>

        <Section title="Inputs & switch">
          <Input label="Name" placeholder="Jane Doe" />
          <Input label="Email" placeholder="jane@example.com" error="Invalid email address" />
          <View style={styles.row}>
            <Text variant="body">Toggle</Text>
            <Switch value={switchOn} onValueChange={setSwitchOn} />
          </View>
        </Section>

        <Section title="Chips">
          <View style={styles.row}>
            <Chip label="All" selected={chip === 'a'} onPress={() => setChip('a')} />
            <Chip label="Hair" selected={chip === 'b'} onPress={() => setChip('b')} />
            <Chip label="Nails" selected={chip === 'c'} onPress={() => setChip('c')} />
          </View>
        </Section>

        <Section title="Badges & status pills">
          <View style={styles.row}>
            <Badge label="New" tone="accent" />
            <Badge label="Paid" tone="success" />
            <Badge label="Online" tone="neutral" />
          </View>
          <View style={styles.wrapRow}>
            {STATUSES.map((s) => (
              <StatusPill key={s} status={s} label={s} />
            ))}
          </View>
        </Section>

        <Section title="Card & list">
          <Card>
            <ListItem title="Profile" subtitle="Name, username, bio" left={<Icon name="settings" />} onPress={() => {}} />
            <Divider inset />
            <ListItem title="Contacts" subtitle="Phone, socials, address" onPress={() => {}} />
          </Card>
          <Card elevated>
            <Text variant="body">Elevated card</Text>
          </Card>
        </Section>

        <Section title="Loading states">
          <Skeleton width="60%" height={22} />
          <SkeletonList rows={3} />
        </Section>

        <Section title="Overlays">
          <View style={styles.row}>
            <Button label="Open sheet" variant="secondary" onPress={() => sheetRef.current?.present()} />
            <Button label="Open modal" variant="secondary" onPress={() => setModalOpen(true)} />
          </View>
        </Section>

        <Section title="Layouts">
          <Text variant="subhead" color="secondary">
            PageLayout & ModalLayout — header slots, scroll-collapsing title, edge-fade
            scrim, glass footer.
          </Text>
          <View style={styles.row}>
            <Link href="/page-layout-demo" asChild>
              <Button label="PageLayout" variant="secondary" />
            </Link>
            <Link href="/modal-layout-demo" asChild>
              <Button label="Modal route" variant="secondary" />
            </Link>
            <Button
              label="Layout sheet"
              variant="secondary"
              onPress={() => layoutSheetRef.current?.present()}
            />
          </View>
          <Text variant="caption" color="tertiary">
            Footer primitive (solid):
          </Text>
          <View style={styles.footerPreview}>
            <Footer
              floating={false}
              background="solid"
              left={<IconButton icon="search" accessibilityLabel="Search" variant="ghost" onPress={() => {}} />}
              center={<IconButton icon="add" accessibilityLabel="Add" variant="accent" onPress={() => {}} />}
              right={<IconButton icon="edit" accessibilityLabel="Edit" variant="ghost" onPress={() => {}} />}
            />
          </View>
        </Section>

        <Section title="Empty state">
          <View style={styles.stateBox}>
            <EmptyState title="No clients yet" description="Add your first client to get started." actionLabel="Add client" onAction={() => {}} />
          </View>
        </Section>

        <Section title="Error state">
          <View style={styles.stateBox}>
            <ErrorState onRetry={() => {}} />
          </View>
        </Section>
      </ScrollView>

      <Sheet ref={sheetRef} snapPoints={['35%']}>
        <Text variant="title3">Bottom sheet</Text>
        <Text variant="body" color="secondary">
          The primary overlay for previews, pickers, and confirmations.
        </Text>
      </Sheet>

      {/* ModalLayout in sheet mode: BottomSheetScrollView content, static scrim, no top
          inset. padded={false} because the Sheet already supplies horizontal padding. */}
      <Sheet ref={layoutSheetRef} snapPoints={['70%']}>
        <ModalLayout
          title="Preferences"
          variant="sheet"
          padded={false}
          onClose={() => layoutSheetRef.current?.dismiss()}
          footer={<Button label="Done" onPress={() => layoutSheetRef.current?.dismiss()} />}>
          {Array.from({ length: 10 }).map((_, i) => (
            <ListItem key={i} title={`Option ${i + 1}`} subtitle="Sheet content scrolls" onPress={() => {}} />
          ))}
        </ModalLayout>
      </Sheet>

      <Modal
        visible={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        title="Delete client?"
        footer={
          <>
            <Button label="Cancel" variant="ghost" onPress={() => setModalOpen(false)} />
            <Button label="Delete" variant="danger" onPress={() => setModalOpen(false)} />
          </>
        }>
        <Text variant="body" color="secondary">
          This cannot be undone.
        </Text>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { padding: theme.space[4], gap: theme.space[6] },
  section: { gap: theme.space[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[3] },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] },
  stateBox: { height: 220, borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: theme.colors.bg.surface },
  footerPreview: { borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: theme.colors.bg.surface },
}));
