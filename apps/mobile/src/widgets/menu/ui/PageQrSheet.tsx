/** QR code of the booking page. No board in the design yet: built from the app's sheet pattern. */
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { StyleSheet } from 'react-native-unistyles';
import { masterPageLabel, masterPageUrl, useMasterProfileQuery } from '@/entities/master';
import { useUserId } from '@/entities/session';
import { Button, SheetChrome, Skeleton, Text } from '@/shared/ui';
import { sharePage } from '../lib/share-page';

const QR_SIZE = 216;

export function PageQrSheet() {
  const { t } = useTranslation();
  const username = useMasterProfileQuery(useUserId() ?? '').data?.username;

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('menuHome.qr.title')} leadingLabel={t('common.close')} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {username ? (
          <>
            {/* A QR code stays black on white in both themes: scanners need the contrast. */}
            <View style={styles.tile}>
              <QRCode value={masterPageUrl(username)} size={QR_SIZE} />
            </View>
            <Text variant="bodyStrong" align="center">
              {masterPageLabel(username)}
            </Text>
            <Text variant="footnote" color="secondary" align="center">
              {t('menuHome.qr.hint')}
            </Text>
            <Button
              label={t('menuHome.qr.share')}
              leftIcon="share"
              onPress={() => sharePage(username)}
            />
          </>
        ) : (
          <Skeleton width={QR_SIZE} height={QR_SIZE} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1 },
  content: {
    alignItems: 'center',
    gap: theme.space[3],
    paddingHorizontal: theme.space[5],
    paddingTop: theme.space[4],
    paddingBottom: theme.space[8],
  },
  tile: {
    padding: theme.space[4],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.constant.white,
  },
}));
