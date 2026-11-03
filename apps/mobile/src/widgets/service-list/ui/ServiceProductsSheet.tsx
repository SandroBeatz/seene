/** What a visit of this service uses: the other side of the product's own list. Optional. */
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { QuantityLinksList, useProductsQuery } from '@/entities/product';
import { useUserId } from '@/entities/session';
import { EmptyState, SheetChrome } from '@/shared/ui';
import { useServiceProductLinks } from '../model/links.store';

export function ServiceProductsSheet() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const products = useProductsQuery(userId);
  const links = useServiceProductLinks((s) => s.links);
  const toggle = useServiceProductLinks((s) => s.toggle);
  const setQuantity = useServiceProductLinks((s) => s.setQuantity);
  const rows = (products.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    unit: t(`menuHome.products.units.${p.content_unit ?? p.unit}`),
  }));

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('menuHome.products.useMaterials')} leadingLabel={t('common.done')} />
      {products.data && rows.length === 0 ? (
        <EmptyState
          icon="tube"
          title={t('menuHome.products.emptyTitle')}
          description={t('menuHome.products.emptyText')}
          actionLabel={t('menuHome.products.add')}
          onAction={() => router.push('/product/new')}
        />
      ) : (
        <QuantityLinksList rows={rows} links={links} onToggle={toggle} onQuantity={setQuantity} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
