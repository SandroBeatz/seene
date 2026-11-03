/**
 * Which services use this product and how much per visit. The design has no screen for it and
 * no amount, but 1 per visit fits a pair of gloves, not a bottle. Saved with the product's form.
 */
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { SelectionMark, SheetChrome, Text } from '@/shared/ui';
import { useProductLinks } from '../model/links.store';
import { QuantityStepper } from './QuantityStepper';

export function ProductServicesSheet() {
  const { t } = useTranslation();
  // The form's current choice, which may not be saved yet.
  const { unit } = useLocalSearchParams<{ unit?: string }>();
  const userId = useUserId() ?? '';
  const services = useServicesQuery(userId);
  const links = useProductLinks((s) => s.links);
  const toggle = useProductLinks((s) => s.toggle);
  const setQuantity = useProductLinks((s) => s.setQuantity);
  // An archived service stays listed while it is linked, so it can be unlinked.
  const rows = (services.data ?? []).filter((s) => s.is_active || links[s.id] !== undefined);

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('menuHome.products.useOn')} leadingLabel={t('common.done')} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <Text variant="caption" color="tertiary" style={styles.hint}>
          {t('menuHome.products.useOnHint')}
        </Text>
        {rows.map((service, index) => {
          const quantity = links[service.id];
          const checked = quantity !== undefined;
          return (
            <View key={service.id} style={index > 0 && styles.separator}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => toggle(service.id)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <Text variant="calloutMedium" numberOfLines={1} style={styles.name}>
                  {service.name}
                </Text>
                <SelectionMark checked={checked} shape="square" />
              </Pressable>
              {checked ? (
                <View style={styles.quantity}>
                  <Text variant="footnote" color="tertiary">
                    {t('menuHome.products.perVisit')}
                  </Text>
                  <QuantityStepper
                    value={quantity}
                    unit={unit ?? ''}
                    label={t('menuHome.products.perVisitA11y', { service: service.name })}
                    onChange={(value) => setQuantity(service.id, value)}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1 },
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[2],
    paddingBottom: theme.space[6],
  },
  hint: { marginBottom: theme.space[2], marginHorizontal: theme.space[1] },
  separator: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  row: {
    minHeight: theme.sizing.row.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  name: { flex: 1 },
  pressed: { opacity: 0.6 },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.space[2.5],
  },
}));
