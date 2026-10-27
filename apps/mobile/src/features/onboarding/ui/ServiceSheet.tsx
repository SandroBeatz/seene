/**
 * Service sheet (design: "Новая услуга" / "Услуга"), a native form sheet over step 3:
 * name, optional description, duration (presets or "Своё время" on the system wheel),
 * price or "Бесплатно", where it shows (section → its own sheet, category → its own
 * sheet), calendar colour, and the Активна / Онлайн-запись switches.
 *
 * Works on the shared editor copy; "Добавить услугу" / "Сохранить" writes it to the
 * draft (picking a section of another profession adds that profession too).
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native-unistyles';
import { SERVICE_COLOR_KEYS, SERVICE_COLORS } from '@/shared/config/palettes';
import { currencySymbol } from '@/shared/lib/formats';
import { isSupportedLocale } from '@/shared/lib/i18n';
import {
  Button,
  Chip,
  DurationPicker,
  FormScreen,
  GroupedCard,
  Icon,
  Input,
  ListItem,
  SectionLabel,
  SheetHeader,
  Switch,
  Text,
} from '@/shared/ui';
import { useOnboardingDraft } from '../model/draft.store';
import { formatDurationLabel } from '../model/format';
import { useServiceEditor } from '../model/service-editor.store';
import { withStoredName } from '../model/services';

/** The design's 8 presets, minutes, 4 per row. */
const PRESET_ROWS = [
  [15, 30, 45, 60],
  [90, 120, 150, 180],
] as const;
const PRESETS: readonly number[] = PRESET_ROWS.flat();
/** Half-hour presets read as clock time in the design ("1:30", "2:30"). */
const presetLabel = (minutes: number, fallback: string) =>
  minutes % 60 === 30 && minutes > 60 ? `${Math.floor(minutes / 60)}:30` : fallback;

export interface ServiceSheetProps {
  onClose: () => void;
  onOpenSection: () => void;
  onOpenCategory: () => void;
}

export function ServiceSheet({ onClose, onOpenSection, onOpenCategory }: ServiceSheetProps) {
  const { t, i18n } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : 'en';
  const { service, isNew, focus, patch, clear } = useServiceEditor();
  const currency = useOnboardingDraft((state) => state.currency);
  const specializations = useOnboardingDraft((state) => state.specializations);
  const saveService = useOnboardingDraft((state) => state.saveService);
  const toggleSpecialization = useOnboardingDraft((state) => state.toggleSpecialization);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [priceText, setPriceText] = useState(
    service?.price ? String(service.price) : '',
  );

  if (!service) return null;

  const free = service.price === 0;
  const custom = !PRESETS.includes(service.duration);
  const canSave = service.name.trim().length > 0 && service.price !== null && service.duration > 0;
  const durationLabel = formatDurationLabel(service.duration, t);

  function close() {
    clear();
    onClose();
  }

  function save() {
    if (!service || !canSave) return;
    if (!specializations.includes(service.specialization)) {
      toggleSpecialization(service.specialization);
    }
    saveService(withStoredName({ ...service, selected: true }, locale));
    close();
  }

  function onPriceChange(text: string) {
    const digits = text.replace(/\D/g, '');
    setPriceText(digits);
    patch({ price: digits ? Number(digits) : null });
  }

  function toggleFree() {
    if (free) {
      patch({ price: priceText ? Number(priceText) : null });
    } else {
      patch({ price: 0 });
    }
  }

  return (
    <>
      <FormScreen
        edges={['bottom']}
        padded={false}
        contentContainerStyle={styles.body}
        header={
          <SheetHeader
            title={isNew ? t('onboarding.serviceSheet.titleNew') : t('onboarding.serviceSheet.titleEdit')}
            leadingLabel={t('common.close')}
            onLeadingPress={close}
          />
        }
        footerDivider
        footer={
          <Button
            label={isNew ? t('onboarding.serviceSheet.add') : t('onboarding.serviceSheet.save')}
            disabled={!canSave}
            onPress={save}
          />
        }>
        <View style={styles.field}>
          <SectionLabel label={t('onboarding.serviceSheet.name')} />
          <Input
            accessibilityLabel={t('onboarding.serviceSheet.name')}
            value={service.name}
            onChangeText={(name) => patch({ name })}
            placeholder={t('onboarding.serviceSheet.namePlaceholder')}
            autoFocus={isNew}
            autoCapitalize="sentences"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <SectionLabel
            label={t('onboarding.serviceSheet.description')}
            trailing={t('onboarding.serviceSheet.optional')}
          />
          <Input
            accessibilityLabel={t('onboarding.serviceSheet.description')}
            value={service.description}
            onChangeText={(description) => patch({ description })}
            placeholder={t('onboarding.serviceSheet.descriptionPlaceholder')}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.field}>
          <SectionLabel
            label={t('onboarding.serviceSheet.duration')}
            trailing={durationLabel}
            trailingStrong
          />
          {PRESET_ROWS.map((row) => (
            <View key={row.join()} style={styles.presetRow}>
              {row.map((minutes) => (
                <View key={minutes} style={styles.preset}>
                  <Chip
                    label={presetLabel(minutes, formatDurationLabel(minutes, t))}
                    selected={service.duration === minutes}
                    onPress={() => patch({ duration: minutes })}
                  />
                </View>
              ))}
            </View>
          ))}
          <Chip
            label={
              custom
                ? t('onboarding.serviceSheet.customDurationValue', { value: durationLabel })
                : t('onboarding.serviceSheet.customDuration')
            }
            icon="clock"
            dashed={!custom}
            selected={custom}
            onPress={() => setPickerOpen(true)}
          />
          <Text variant="caption" color="secondary">
            {t('onboarding.serviceSheet.durationHint')}
          </Text>
        </View>

        <View style={styles.field}>
          <SectionLabel label={t('onboarding.serviceSheet.price')} />
          <View style={styles.priceRow}>
            <View style={styles.priceInput}>
              <Input
                accessibilityLabel={t('onboarding.serviceSheet.price')}
                size="lg"
                strong
                value={free ? '0' : priceText}
                onChangeText={onPriceChange}
                placeholder="0"
                keyboardType="number-pad"
                inputMode="numeric"
                suffix={currencySymbol(currency, i18n.language)}
                inactive={free}
                focusRing={focus === 'price' && !free}
                autoFocus={focus === 'price' && !free}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: free }}
              onPress={toggleFree}
              style={({ pressed }) => [styles.free, free && styles.freeOn, pressed && styles.pressed]}>
              <Text variant="subheadStrong" color={free ? 'onAccent' : 'primary'}>
                {t('onboarding.serviceSheet.free')}
              </Text>
            </Pressable>
          </View>
          {focus === 'price' ? (
            <Text variant="caption" color="secondary">
              {t('onboarding.serviceSheet.priceHint')}
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <SectionLabel label={t('onboarding.serviceSheet.where')} />
          <GroupedCard variant="outlined">
            <ListItem
              title={t('onboarding.serviceSheet.section')}
              trailingText={t(`onboarding.specializations.${service.specialization}`)}
              size="sm"
              inset={false}
              onPress={onOpenSection}
            />
            <ListItem
              title={t('onboarding.serviceSheet.category')}
              titleNote={t('onboarding.serviceSheet.optional')}
              trailingText={service.category ?? t('onboarding.serviceSheet.noCategory')}
              size="sm"
              inset={false}
              onPress={onOpenCategory}
            />
          </GroupedCard>
        </View>

        <View style={styles.colorField}>
          <SectionLabel label={t('onboarding.serviceSheet.color')} />
          <View style={styles.swatches} accessibilityRole="radiogroup">
            {SERVICE_COLOR_KEYS.map((key) => {
              const on = service.color === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={t(`onboarding.serviceSheet.colors.${key}`)}
                  onPress={() => patch({ color: key })}
                  style={[styles.swatch, { backgroundColor: SERVICE_COLORS[key] }, on && styles.swatchOn]}>
                  {on ? <Icon name="check" size={14} weight="black" color="constant.ink" /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        <GroupedCard variant="outlined">
          <SwitchRow
            title={t('onboarding.serviceSheet.active')}
            hint={t('onboarding.serviceSheet.activeHint')}
            value={service.active}
            onChange={(active) => patch({ active })}
          />
          <SwitchRow
            title={t('onboarding.serviceSheet.online')}
            hint={t('onboarding.serviceSheet.onlineHint')}
            value={service.online}
            onChange={(online) => patch({ online })}
          />
        </GroupedCard>
      </FormScreen>

      <DurationPicker
        visible={pickerOpen}
        value={service.duration}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(duration) => {
          patch({ duration });
          setPickerOpen(false);
        }}
        title={t('onboarding.serviceSheet.pickerTitle')}
        cancelLabel={t('onboarding.serviceSheet.pickerCancel')}
        doneLabel={t('onboarding.serviceSheet.pickerDone')}
        hoursUnit={t('onboarding.serviceSheet.hoursUnit')}
        minutesUnit={t('onboarding.serviceSheet.minutesUnit')}
      />
    </>
  );
}

function SwitchRow({
  title,
  hint,
  value,
  onChange,
}: {
  title: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" color="secondary">
          {hint}
        </Text>
      </View>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={title} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  body: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[3.5],
    paddingBottom: theme.space[5],
    gap: theme.space[5],
  },
  field: { gap: theme.space[2] },
  colorField: { gap: theme.space[2.5] },
  presetRow: { flexDirection: 'row', gap: theme.space[2] },
  preset: { flex: 1 },
  priceRow: { flexDirection: 'row', gap: theme.space[2], alignItems: 'center' },
  priceInput: { flex: 1, minWidth: 0 },
  free: {
    height: theme.sizing.control.xl,
    paddingHorizontal: theme.space[4],
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.bg.canvas,
    justifyContent: 'center',
  },
  freeOn: {
    backgroundColor: theme.colors.accent.default,
    borderColor: theme.colors.accent.default,
  },
  swatches: { flexDirection: 'row', justifyContent: 'space-between' },
  swatch: {
    width: theme.sizing.swatch,
    height: theme.sizing.swatch,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchOn: {
    boxShadow: `0 0 0 2px ${theme.colors.bg.canvas}, 0 0 0 4px ${theme.colors.accent.default}`,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[3],
  },
  switchText: { flex: 1, minWidth: 0, gap: theme.space[0.5] },
  pressed: { opacity: 0.7 },
}));
