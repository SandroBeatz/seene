/** Another name for personal time. An empty one removes it: the schedule says "Личное время". */
import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useUserId } from '@/entities/session';
import {
  useTimeBlockQuery,
  useUpdateTimeBlockMutation,
  type TimeBlock,
} from '@/entities/time-block';
import { Button, FormScreen, SheetChrome } from '@/shared/ui';
import { BlockFallback } from './BlockFallback';
import { NameFields } from './NameFields';

export function TimeBlockNameSheet({ blockId }: { blockId: string }) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const query = useTimeBlockQuery(userId, blockId);
  const block = query.data;

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('personalTime.what.name')} leadingLabel={t('common.close')} />
      {block ? <NameForm block={block} userId={userId} /> : <BlockFallback query={query} />}
    </View>
  );
}

function NameForm({ block, userId }: { block: TimeBlock; userId: string }) {
  const { t } = useTranslation();
  const update = useUpdateTimeBlockMutation(userId);
  const existing = block.notes?.trim() ?? '';
  const [name, setName] = useState(existing);

  const save = () =>
    update.mutate(
      { id: block.id, notes: name.trim() || null },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
      },
    );

  return (
    <FormScreen
      contentContainerStyle={styles.content}
      footer={
        <Button
          label={t('common.save')}
          disabled={name.trim() === existing}
          loading={update.isPending}
          onPress={save}
          fullWidth
        />
      }>
      <NameFields value={name} onChange={setName} />
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  content: { paddingTop: theme.space[3], gap: theme.space[4.5] },
}));
