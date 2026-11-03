/**
 * Which services use this product and how much per visit. The design has no screen for it and
 * no amount, but 1 per visit fits a pair of gloves, not a bottle. Saved with the product's form.
 */
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { QuantityLinksList, type ProductContentUnit, type ProductUnit } from '@/entities/product';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { SheetChrome } from '@/shared/ui';
import { useProductLinks } from '../model/links.store';

export function ProductServicesSheet() {
  const { t } = useTranslation();
  // The form's current choice, which may not be saved yet.
  const { unit } = useLocalSearchParams<{ unit: ProductUnit | ProductContentUnit }>();
  const userId = useUserId() ?? '';
  const services = useServicesQuery(userId);
  const links = useProductLinks((s) => s.links);
  const toggle = useProductLinks((s) => s.toggle);
  const setQuantity = useProductLinks((s) => s.setQuantity);
  // An archived service stays listed while it is linked, so it can be unlinked.
  const rows = (services.data ?? [])
    .filter((s) => s.is_active || links[s.id] !== undefined)
    .map((s) => ({ id: s.id, name: s.name, unit: t(`menuHome.products.units.${unit}`) }));

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('menuHome.products.useOn')} leadingLabel={t('common.done')} />
      <QuantityLinksList rows={rows} links={links} onToggle={toggle} onQuantity={setQuantity} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
