/** Rows to tick, each with how much one visit uses. The same from a product and from a service. */
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { SelectionMark, Text } from '@/shared/ui';
import { QuantityStepper } from './QuantityStepper';

export function QuantityLinksList({
  rows,
  links,
  onToggle,
  onQuantity,
}: {
  rows: readonly { id: string; name: string; unit: string }[];
  links: Record<string, string>;
  onToggle: (id: string) => void;
  onQuantity: (id: string, quantity: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      <Text variant="caption" color="tertiary" style={styles.hint}>
        {t('menuHome.products.useOnHint')}
      </Text>
      {rows.map((row, index) => {
        const quantity = links[row.id];
        const checked = quantity !== undefined;
        return (
          <View key={row.id} style={index > 0 && styles.separator}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => onToggle(row.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Text variant="calloutMedium" numberOfLines={1} style={styles.name}>
                {row.name}
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
                  unit={row.unit}
                  label={t('menuHome.products.perVisitA11y', { service: row.name })}
                  onChange={(value) => onQuantity(row.id, value)}
                />
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
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
