/**
 * Section sheet (design: "Раздел"), over the service sheet: which profession the
 * service belongs to — the master's own professions first, then the others. A pick
 * applies at once; one from another profession is added to the profile on save.
 */
import { Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import {
  SPECIALIZATION_IMAGES,
  SPECIALIZATION_KEYS,
  type SpecializationKey,
} from '@/shared/config/specializations';
import { Button, FormScreen, SectionLabel, SelectionMark, SheetHeader, Text } from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';
import { useServiceEditor } from '../model/service-editor.store';

export interface SectionSheetProps {
  onBack: () => void;
}

export function SectionSheet({ onBack }: SectionSheetProps) {
  const { t } = useTranslation();
  const mine = useOnboardingDraft((state) => state.specializations);
  const current = useServiceEditor((state) => state.service?.specialization);
  const patch = useServiceEditor((state) => state.patch);

  const groups: { title: string; keys: SpecializationKey[] }[] = [
    { title: t('onboarding.sectionSheet.mine'), keys: SPECIALIZATION_KEYS.filter((k) => mine.includes(k)) },
    { title: t('onboarding.sectionSheet.others'), keys: SPECIALIZATION_KEYS.filter((k) => !mine.includes(k)) },
  ];

  return (
    <FormScreen
      edges={['bottom']}
      padded={false}
      contentContainerStyle={styles.body}
      header={
        <SheetHeader
          title={t('onboarding.sectionSheet.title')}
          leading="back"
          leadingLabel={t('onboarding.sectionSheet.back')}
          onLeadingPress={onBack}
        />
      }
      footerDivider
      footer={<Button label={t('onboarding.sectionSheet.done')} onPress={onBack} />}>
      {groups
        .filter((group) => group.keys.length > 0)
        .map((group) => (
          <View key={group.title} style={styles.group} accessibilityRole="radiogroup">
            <View style={styles.groupLabel}>
              <SectionLabel label={group.title} />
            </View>
            {group.keys.map((key) => {
              const on = key === current;
              const label = t(`onboarding.specializations.${key}`);
              return (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={label}
                  onPress={() => patch({ specialization: key })}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                  <Image source={SPECIALIZATION_IMAGES[key]} style={styles.thumb} contentFit="cover" />
                  <Text variant="calloutStrong" style={styles.label}>
                    {label}
                  </Text>
                  <SelectionMark checked={on} shape="circle" />
                </Pressable>
              );
            })}
          </View>
        ))}
      <Text variant="caption" color="secondary" style={styles.hint}>
        {t('onboarding.sectionSheet.hint')}
      </Text>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  body: { paddingHorizontal: theme.layout.gutter, paddingTop: theme.space[2] },
  group: { marginTop: theme.space[3.5] },
  groupLabel: { marginBottom: theme.space[1] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3.5],
    minHeight: theme.sizing.row.lg,
    paddingVertical: theme.space[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  thumb: {
    width: theme.sizing.avatar.md,
    height: theme.sizing.avatar.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg.sunken,
  },
  label: { flex: 1 },
  hint: { marginTop: theme.space[3.5], marginBottom: theme.space[5] },
  pressed: { opacity: 0.7 },
}));
