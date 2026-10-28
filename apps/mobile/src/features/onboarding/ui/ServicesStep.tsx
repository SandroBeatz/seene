/**
 * Step 3 of 4 — "Ваши услуги": the starter services of the picked professions,
 * grouped by profession, the typical ones pre-ticked. Prices are optional here;
 * "Своя услуга" and the row links open the service sheet. "Настрою потом" goes on
 * without services (the picks are kept in case the master comes back).
 */
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { isSupportedLocale, pluralCategory } from '@/shared/lib/i18n';
import { Button, FormScreen, Icon, ScreenTitle, SectionLabel, Text } from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';
import { type EditorFocus, useServiceEditor } from '../model/service-editor.store';
import { type DraftService, groupByProfession, serviceName } from '../model/services';
import { useOnboardingHeaderInset } from './OnboardingHeader';
import { ServiceRow } from './ServiceRow';

export interface ServicesStepProps {
  /** Open the service sheet (the editor already holds the service). */
  onOpenService: () => void;
  /** Go to step 4 ("Дальше" or "Настрою потом"). */
  onContinue: () => void;
}

export function ServicesStep({ onOpenService, onContinue }: ServicesStepProps) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const services = useOnboardingDraft((state) => state.services);
  const specializations = useOnboardingDraft((state) => state.specializations);
  const currency = useOnboardingDraft((state) => state.currency);
  const syncServices = useOnboardingDraft((state) => state.syncServices);
  const toggleService = useOnboardingDraft((state) => state.toggleService);
  const setServicesSkipped = useOnboardingDraft((state) => state.setServicesSkipped);
  const editor = useServiceEditor();
  const headerInset = useOnboardingHeaderInset();

  // Entering the step: bring in the templates of the professions picked on step 2.
  // Runs once (the action is stable), so a profession added from the section sheet
  // does not re-seed its templates while the master is here.
  useEffect(() => {
    syncServices();
  }, [syncServices]);

  const groups = groupByProfession(services);
  const count = services.filter((s) => s.selected).length;

  function open(service: DraftService, focus: EditorFocus) {
    editor.edit({ ...service, name: serviceName(service, locale) }, focus);
    onOpenService();
  }

  function createOwn() {
    editor.create(specializations[0] ?? 'manicure');
    onOpenService();
  }

  return (
    <FormScreen
      edges={['right', 'bottom', 'left']}
      // The floating step header owns the top inset; no automatic one on top of it.
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={{ paddingTop: headerInset }}
      footerDivider
      footer={
        <View style={styles.footer}>
          <Button
            label={
              count
                ? t(`onboarding.services.next_${pluralCategory(count, locale)}`, { count })
                : t('onboarding.services.nextEmpty')
            }
            disabled={count === 0}
            onPress={() => {
              setServicesSkipped(false);
              onContinue();
            }}
          />
          <Button
            label={t('onboarding.services.later')}
            variant="ghost"
            tone="secondary"
            size="md"
            onPress={() => {
              setServicesSkipped(true);
              onContinue();
            }}
          />
        </View>
      }>
      <View style={styles.title}>
        <ScreenTitle
          title={t('onboarding.services.title')}
          subtitle={t('onboarding.services.subtitle')}
        />
      </View>

      {groups.map((group) => (
        <View key={group.specialization} style={styles.group}>
          <View style={styles.groupLabel}>
            <SectionLabel label={t(`onboarding.specializations.${group.specialization}`)} />
          </View>
          {group.services.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              name={serviceName(service, locale)}
              currency={currency}
              onToggle={() => toggleService(service.id)}
              onEdit={() => open(service, 'name')}
              onAddPrice={() => open(service, 'price')}
            />
          ))}
        </View>
      ))}

      <Pressable
        accessibilityRole="button"
        onPress={createOwn}
        style={({ pressed }) => [styles.custom, pressed && styles.pressed]}>
        <Icon name="add" size="sm" weight="medium" />
        <Text variant="bodyStrong">{t('onboarding.services.custom')}</Text>
      </Pressable>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: { marginTop: theme.space[7] },
  group: { marginTop: theme.space[5.5] },
  groupLabel: { marginBottom: theme.space[1] },
  custom: {
    marginTop: theme.space[3.5],
    marginBottom: theme.space[4],
    height: theme.sizing.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.space[2],
  },
  footer: { gap: theme.space[1.5] },
  pressed: { opacity: 0.6 },
}));
