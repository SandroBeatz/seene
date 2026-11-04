/** "Способ оплаты": two columns of the master's methods, the chosen one outlined. */
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import type { PaymentType } from '@/entities/payment-type';
import { Skeleton, Text } from '@/shared/ui';

export function PaymentMethodGrid({
  methods,
  value,
  onChange,
}: {
  methods: PaymentType[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const { t } = useTranslation();
  if (methods.length === 0) return <Skeleton height={46} radius={14} />;
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {methods.map((method) => {
        const on = method.id === value;
        return (
          <Pressable
            key={method.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(method.id)}
            style={[styles.method, on && styles.on]}>
            {/* The method's own colour, as in payment settings. */}
            <View style={[styles.dot, { backgroundColor: method.color }]} />
            <Text variant="bodyMedium" numberOfLines={1} style={styles.name}>
              {method.kind === 'custom' ? method.name : t(`checkout.methods.${method.kind}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2] },
  method: {
    width: '48.8%',
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: theme.space[3.5],
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  on: { borderWidth: 1.5, borderColor: theme.colors.accent.default },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { flex: 1, minWidth: 0 },
}));
