/**
 * Category sheet (design: "Категория · в разделе «…»"), over the service sheet:
 * "Без категории" or one of the master's categories (with how many picked services
 * use it). "+" opens an inline field to create one, which is picked right away.
 */
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { MAX_FONT_SCALE } from '@/shared/theme/tokens';
import { Button, FormScreen, IconButton, SelectionMark, SheetHeader, Text } from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';
import { useServiceEditor } from '../model/service-editor.store';

export interface CategorySheetProps {
  onBack: () => void;
}

export function CategorySheet({ onBack }: CategorySheetProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useUnistyles();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const categories = useOnboardingDraft((state) => state.categories);
  const services = useOnboardingDraft((state) => state.services);
  const addCategory = useOnboardingDraft((state) => state.addCategory);
  const service = useServiceEditor((state) => state.service);
  const patch = useServiceEditor((state) => state.patch);
  const [adding, setAdding] = useState(categories.length === 0);
  const [name, setName] = useState('');

  if (!service) return null;

  const trimmed = name.trim();
  const canCreate =
    trimmed.length > 0 && !categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());

  function create() {
    if (!canCreate) return;
    addCategory(trimmed);
    patch({ category: trimmed });
    setName('');
    setAdding(false);
  }

  function countLabel(category: string) {
    const n = services.filter((s) => s.selected && s.category === category).length;
    if (n === 0) return t('onboarding.categorySheet.new');
    return t(`onboarding.categorySheet.count_${pluralCategory(n, locale)}`, { count: n });
  }

  const options: (string | null)[] = [null, ...categories];

  return (
    <FormScreen
      edges={['bottom']}
      padded={false}
      contentContainerStyle={styles.body}
      header={
        <SheetHeader
          title={t('onboarding.categorySheet.title')}
          subtitle={t('onboarding.categorySheet.inSection', {
            section: t(`onboarding.specializations.${service.specialization}`),
          })}
          leading="back"
          leadingLabel={t('onboarding.sectionSheet.back')}
          onLeadingPress={onBack}
          trailing={
            <IconButton
              icon={adding ? 'close' : 'add'}
              variant={adding ? 'accent' : 'neutral'}
              accessibilityLabel={
                adding ? t('onboarding.categorySheet.cancelAdd') : t('onboarding.categorySheet.add')
              }
              accessibilityState={{ expanded: adding }}
              onPress={() => {
                setAdding((value) => !value);
                setName('');
              }}
            />
          }
        />
      }
      footerDivider
      footer={<Button label={t('onboarding.categorySheet.done')} onPress={onBack} />}>
      {adding ? (
        <View style={styles.addRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('onboarding.categorySheet.newPlaceholder')}
            placeholderTextColor={theme.colors.content.tertiary}
            selectionColor={theme.colors.accent.default}
            cursorColor={theme.colors.accent.default}
            accessibilityLabel={t('onboarding.categorySheet.newA11y')}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            autoFocus
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={create}
            style={styles.addInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canCreate }}
            disabled={!canCreate}
            onPress={create}
            style={[styles.create, canCreate && styles.createOn]}>
            <Text variant="bodyStrong" color={canCreate ? 'onAccent' : 'tertiary'}>
              {t('onboarding.categorySheet.create')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View accessibilityRole="radiogroup">
        {options.map((category) => {
          const on = service.category === category;
          const none = category === null;
          const label = none ? t('onboarding.categorySheet.none') : category;
          return (
            <Pressable
              key={category ?? '∅'}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={label}
              onPress={() => patch({ category })}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.rowText}>
                <Text variant="calloutStrong" color={none ? 'secondary' : 'primary'}>
                  {label}
                </Text>
                {none ? null : (
                  <Text variant="caption" color="secondary">
                    {countLabel(category)}
                  </Text>
                )}
              </View>
              <SelectionMark checked={on} shape="circle" />
            </Pressable>
          );
        })}
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  body: { paddingHorizontal: theme.layout.gutter, paddingTop: theme.space[3.5] },
  addRow: {
    flexDirection: 'row',
    gap: theme.space[2],
    paddingBottom: theme.space[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  addInput: {
    flex: 1,
    minWidth: 0,
    height: theme.sizing.inlineField,
    borderRadius: theme.radius.field,
    borderWidth: 1.5,
    borderColor: theme.colors.border.focus,
    paddingHorizontal: theme.space[3.5],
    color: theme.colors.content.primary,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
  },
  create: {
    height: theme.sizing.inlineField,
    paddingHorizontal: theme.space[4],
    borderRadius: theme.radius.field,
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.surface,
  },
  createOn: { backgroundColor: theme.colors.accent.default },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3.5],
    minHeight: theme.sizing.row.md,
    paddingVertical: theme.space[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  rowText: { flex: 1, minWidth: 0, gap: theme.space[0.5] },
  pressed: { opacity: 0.7 },
}));
