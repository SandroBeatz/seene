/** − value + (design "Остаток"). The value can be typed too: 500 ml is far by buttons. */
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Text } from '@/shared/ui';
import { stepQuantity } from '../lib/quantity';

export function QuantityStepper({
  value,
  unit,
  label,
  onChange,
}: {
  value: string;
  unit: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('menuHome.products.less')}
        onPress={() => onChange(stepQuantity(value, -1))}
        style={({ pressed }) => [styles.button, styles.minus, pressed && styles.pressed]}>
        <Text variant="title3">−</Text>
      </Pressable>
      <View style={styles.value}>
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          selectTextOnFocus
          selectionColor={theme.colors.accent.default}
          style={styles.input}
        />
        <Text variant="bodyStrong" color="tertiary">
          {unit}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('menuHome.products.more')}
        onPress={() => onChange(stepQuantity(value, 1))}
        style={({ pressed }) => [styles.button, styles.plus, pressed && styles.pressed]}>
        <Text variant="title3" color="onAccent">
          +
        </Text>
      </Pressable>
    </View>
  );
}

const SIZE = 38;

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1] },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minus: { backgroundColor: theme.colors.bg.canvas },
  plus: { backgroundColor: theme.colors.accent.default },
  pressed: { opacity: 0.7 },
  value: {
    minWidth: 62,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 3,
  },
  input: {
    minWidth: 18,
    maxWidth: 64,
    padding: 0,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: theme.colors.content.primary,
  },
}));
