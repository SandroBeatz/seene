/** The name of personal time, for creating and for renaming it: typed or a quick pick. */
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Chip, Text } from '@/shared/ui';

const TITLE_MAX_LENGTH = 60;

export function NameFields({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const presets = t('personalTime.what.presets', { returnObjects: true }) as string[];

  return (
    <>
      <View style={styles.field}>
        <Text variant="footnote" color="tertiary">
          {t('personalTime.what.name')}
        </Text>
        <TextInput
          accessibilityLabel={t('personalTime.what.name')}
          value={value}
          onChangeText={onChange}
          placeholder={t('personalTime.what.namePlaceholder')}
          placeholderTextColor={theme.colors.content.tertiary}
          maxLength={TITLE_MAX_LENGTH}
          returnKeyType="done"
          style={styles.input}
        />
      </View>

      <View style={styles.group}>
        <Text variant="footnote" color="tertiary">
          {t('personalTime.what.quick')}
        </Text>
        <View style={styles.chips}>
          {presets.map((preset) => (
            <Chip
              key={preset}
              shape="pill"
              label={preset}
              selected={value.trim() === preset}
              onPress={() => onChange(preset)}
            />
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  field: {
    minHeight: 58,
    justifyContent: 'center',
    gap: 2,
    paddingVertical: theme.space[2.5],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.bg.surface,
  },
  input: {
    padding: 0,
    color: theme.colors.content.primary,
    ...theme.typography.bodyLarge,
  },
  group: { gap: theme.space[1.5] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[1.5] },
}));
