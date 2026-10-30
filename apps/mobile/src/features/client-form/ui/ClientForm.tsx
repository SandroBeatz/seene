/**
 * "Новый клиент" / "Редактировать" (design): the avatar with its nine backgrounds,
 * name, phone with the country code, the messengers the master adds, birthday,
 * VIP and the client note; the save button below says what is missing.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  contactToCard,
  useCreateClientMutation,
  useUpdateClientMutation,
  type Client,
  type ClientCardDto,
} from '@/entities/client';
import { useUserId } from '@/entities/session';
import { normalizeError } from '@/shared/api/errors';
import { AVATAR_COLOR_KEYS, AVATAR_GRADIENTS } from '@/shared/config/palettes';
import {
  dialCode,
  resolvePhoneInput,
  type CountryCode,
} from '@/shared/lib/phone';
import { pickPhoneBookContact } from '@/shared/lib/phone-book';
import {
  Avatar,
  BirthdayPicker,
  Button,
  Icon,
  IconButton,
  Switch,
  Text,
  VipBadge,
  type IconName,
} from '@/shared/ui';
import {
  cardFromDraft,
  draftFromClient,
  draftInitials,
  emptyDraft,
  MESSENGERS,
  whatsappSeed,
  withCard,
  type ClientDraft,
  type Messenger,
} from '../model/draft';
import { useDeleteClient } from '../model/useDeleteClient';
import { CLIENT_NOTE_MAX_LENGTH } from './ClientNoteEditor';
import { CountrySheet } from './CountrySheet';

export interface ClientFormProps {
  /** The client being edited; absent for a new one. */
  client?: Client;
  /** The country a new phone is typed in. */
  defaultCountry: CountryCode;
  /** A new client started from a phone book contact. */
  prefill?: ClientCardDto | null;
}

const MESSENGER_ICON: Record<Messenger, IconName> = {
  whatsapp: 'whatsapp',
  telegram: 'telegram',
  instagram: 'instagram',
};

export function ClientForm({ client, defaultCountry, prefill }: ClientFormProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const userId = useUserId() ?? '';
  const create = useCreateClientMutation(userId);
  const update = useUpdateClientMutation(userId);
  const deleteClient = useDeleteClient();

  const [draft, setDraft] = useState<ClientDraft>(() => {
    if (client) return draftFromClient(client, defaultCountry, 'lavender');
    const empty = emptyDraft(defaultCountry, 'lavender');
    return prefill ? withCard(empty, prefill) : empty;
  });
  const [countryOpen, setCountryOpen] = useState(false);
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(!!draft.notes);

  const set = <K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const setMessenger = (key: Messenger, value: string | null) =>
    setDraft((current) => ({ ...current, messengers: { ...current.messengers, [key]: value } }));

  const initials = draftInitials(draft);
  const hasName = !!draft.firstName.trim();
  const monthNames = t('monthsGenitive', { returnObjects: true }) as string[];
  const pending = create.isPending || update.isPending;

  const fromPhoneBook = async () => {
    try {
      const contact = await pickPhoneBookContact();
      const card = contact ? contactToCard(contact, draft.phoneCountry) : null;
      if (card) setDraft((current) => withCard(current, card));
    } catch {
      Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));
    }
  };

  const onPhone = (text: string) => {
    const state = resolvePhoneInput(text, draft.phoneCountry);
    setDraft((current) => ({
      ...current,
      phone: state.display || text,
      phoneCountry: state.country ?? current.phoneCountry,
    }));
  };

  const save = () => {
    const result = cardFromDraft(draft);
    if (!result.ok) return Alert.alert(t(`clients.form.errors.${result.error}`));
    const done = {
      onSuccess: () => router.back(),
      onError: (error: unknown) => {
        const kind = normalizeError(error).kind;
        Alert.alert(
          kind === 'duplicate_phone' ? t('clients.form.errors.duplicate') : t('actions.failedTitle'),
          kind === 'duplicate_phone' ? undefined : t('actions.failedMessage'),
        );
      },
    };
    if (client) update.mutate({ id: client.id, ...result.card }, done);
    else create.mutate(result.card, done);
  };

  const birthdayLabel = draft.birthday
    ? `${draft.birthday.day} ${monthNames[draft.birthday.month - 1] ?? ''}`
    : '';

  return (
    // Kept as a real view: a form sheet (react-native-screens) pins a ScrollView that
    // is a direct child of the screen to the top and stretches it over the header.
    <View style={styles.root} collapsable={false}>
      <View style={styles.grabber} />
      <View style={styles.header}>
        <IconButton
          icon="close"
          variant="neutral"
          accessibilityLabel={t('clients.form.close')}
          onPress={() => router.back()}
        />
        <Text variant="calloutStrong" align="center" style={styles.title}>
          {client ? t('clients.form.editTitle') : t('clients.form.newTitle')}
        </Text>
        {client ? (
          <IconButton
            icon="trash"
            variant="ghost"
            iconColor="tone.danger.fg"
            accessibilityLabel={t('clients.form.delete')}
            onPress={() => deleteClient(client)}
          />
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={96}>
        <View style={styles.avatarBlock}>
          <View style={[styles.avatarShadow, !initials && styles.avatarEmpty]}>
            <Avatar
              name={`${draft.firstName} ${draft.lastName}`.trim() || '?'}
              color={draft.avatarColor}
              size="xxxl"
            />
          </View>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t('clients.form.avatarA11y')}
            style={styles.swatches}>
            {AVATAR_COLOR_KEYS.map((key) => {
              const on = draft.avatarColor === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={t(`clients.form.colors.${key}`)}
                  hitSlop={4}
                  onPress={() => set('avatarColor', key)}
                  style={[styles.swatchRing, on && styles.swatchRingOn]}>
                  <LinearGradient
                    colors={AVATAR_GRADIENTS[key]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.swatch}
                  />
                </Pressable>
              );
            })}
          </View>
          <Text variant="caption" color="tertiary">
            {t('clients.form.avatarCaption', { name: t(`clients.form.colors.${draft.avatarColor}`) })}
          </Text>
        </View>

        <View style={styles.fields}>
          <Field
            label={t('clients.form.firstName')}
            value={draft.firstName}
            onChangeText={(v) => set('firstName', v)}
            placeholder={t('clients.form.firstNamePlaceholder')}
            autoComplete="given-name"
            textContentType="givenName"
            autoCapitalize="words"
          />
          <Field
            label={t('clients.form.lastName')}
            value={draft.lastName}
            onChangeText={(v) => set('lastName', v)}
            placeholder={t('clients.form.optional')}
            autoComplete="family-name"
            textContentType="familyName"
            autoCapitalize="words"
          />

          <View style={styles.phone}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('clients.form.countryA11y', { country: draft.phoneCountry })}
              onPress={() => setCountryOpen(true)}
              style={({ pressed }) => [styles.country, pressed && styles.pressed]}>
              <Text variant="calloutMedium">{`${draft.phoneCountry} ${dialCode(draft.phoneCountry)}`}</Text>
              <Icon name="chevronDown" size={14} color="content.tertiary" />
            </Pressable>
            <View style={styles.phoneInput}>
              <Text variant="caption" color="tertiary">
                {t('clients.form.phone')}
              </Text>
              <TextInput
                value={draft.phone}
                onChangeText={onPhone}
                placeholder={t('clients.form.phonePlaceholder')}
                placeholderTextColor={theme.colors.content.tertiary}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                accessibilityLabel={t('clients.form.phone')}
                style={[styles.input, styles.inputMedium]}
              />
            </View>
          </View>

          {MESSENGERS.map((key) =>
            draft.messengers[key] === null ? null : (
              <View key={key} style={styles.messenger}>
                <Icon name={MESSENGER_ICON[key]} size="md" color="content.primary" />
                <View style={styles.grow}>
                  <Text variant="caption" color="tertiary">
                    {t(`clients.form.messengers.${key}`)}
                  </Text>
                  <TextInput
                    value={draft.messengers[key] ?? ''}
                    onChangeText={(v) => setMessenger(key, v)}
                    placeholder={
                      key === 'whatsapp'
                        ? `${dialCode(draft.phoneCountry)} ${t('clients.form.phonePlaceholder')}`
                        : t('clients.form.usernamePlaceholder')
                    }
                    placeholderTextColor={theme.colors.content.tertiary}
                    keyboardType={key === 'whatsapp' ? 'phone-pad' : 'default'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel={t(`clients.form.messengers.${key}`)}
                    style={styles.input}
                  />
                </View>
                <IconButton
                  icon="close"
                  variant="ghost"
                  iconColor="content.tertiary"
                  accessibilityLabel={t('clients.form.remove', {
                    name: t(`clients.form.messengers.${key}`),
                  })}
                  onPress={() => setMessenger(key, null)}
                />
              </View>
            ),
          )}

          {MESSENGERS.some((key) => draft.messengers[key] === null) ? (
            <View style={styles.addMessengers}>
              <Text variant="caption" color="tertiary">
                {t('clients.form.addMessenger')}
              </Text>
              <View style={styles.messengerChips}>
                {MESSENGERS.filter((key) => draft.messengers[key] === null).map((key) => (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    onPress={() => setMessenger(key, key === 'whatsapp' ? whatsappSeed(draft) : '')}
                    style={({ pressed }) => [styles.messengerChip, pressed && styles.pressed]}>
                    <Icon name={MESSENGER_ICON[key]} size="base" color="content.primary" />
                    <Text variant="footnote" style={styles.medium}>
                      {t(`clients.form.messengers.${key}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.birthday}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setBirthdayOpen(true)}
              style={({ pressed }) => [styles.grow, styles.birthdayMain, pressed && styles.pressed]}>
              <Text variant="caption" color="tertiary">
                {t('clients.form.birthday')}
              </Text>
              <Text variant="callout" color={birthdayLabel ? 'primary' : 'tertiary'} numberOfLines={1}>
                {birthdayLabel || t('clients.form.birthdayPlaceholder')}
              </Text>
            </Pressable>
            {draft.birthday ? (
              <IconButton
                icon="close"
                variant="ghost"
                iconColor="content.tertiary"
                accessibilityLabel={t('clients.form.clearBirthday')}
                onPress={() => set('birthday', null)}
              />
            ) : null}
          </View>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: draft.vip }}
            onPress={() => set('vip', !draft.vip)}
            style={styles.vip}>
            <View style={styles.grow}>
              <View style={styles.vipTitle}>
                <Text variant="bodyMedium">{t('clients.form.vip')}</Text>
                <VipBadge accessibilityLabel={t('clients.list.vipA11y')} />
              </View>
              <Text variant="caption" color="tertiary">
                {t('clients.form.vipHint')}
              </Text>
            </View>
            <Switch value={draft.vip} onValueChange={(v) => set('vip', v)} />
          </Pressable>

          {noteOpen ? (
            <View style={styles.note}>
              <Icon name="note" size="md" color="content.tertiary" />
              <View style={styles.grow}>
                <Text variant="caption" color="tertiary">
                  {t('clients.form.note')}
                </Text>
                <TextInput
                  value={draft.notes}
                  onChangeText={(v) => set('notes', v)}
                  placeholder={t('clients.form.notePlaceholder')}
                  placeholderTextColor={theme.colors.content.tertiary}
                  multiline
                  autoFocus={!draft.notes}
                  maxLength={CLIENT_NOTE_MAX_LENGTH}
                  accessibilityLabel={t('clients.form.note')}
                  style={[styles.input, styles.noteInput]}
                />
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setNoteOpen(true)}
              style={({ pressed }) => [styles.addNote, pressed && styles.pressed]}>
              <Icon name="note" size="md" color="content.secondary" />
              <Text variant="subhead" color="secondary" style={styles.medium}>
                {t('clients.form.addNote')}
              </Text>
            </Pressable>
          )}

          {client ? null : (
            <Pressable
              accessibilityRole="button"
              onPress={() => void fromPhoneBook()}
              style={({ pressed }) => [styles.pickContact, pressed && styles.pressed]}>
              <Icon name="contacts" size="sm" color="content.primary" />
              <Text variant="subheadStrong">{t('clients.pickContact')}</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ opened: insets.bottom - theme.space[3] }}>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, theme.space[4]) }]}>
          <Button
            label={
              hasName
                ? client
                  ? t('clients.form.submitEdit')
                  : t('clients.form.submitNew')
                : t('clients.form.needName')
            }
            onPress={save}
            disabled={!hasName}
            loading={pending}
            fullWidth
          />
        </View>
      </KeyboardStickyView>

      <CountrySheet
        visible={countryOpen}
        value={draft.phoneCountry}
        onClose={() => setCountryOpen(false)}
        onPick={(country) => {
          setDraft((current) => ({
            ...current,
            phoneCountry: country,
            phone: resolvePhoneInput(current.phone, country).display || current.phone,
          }));
        }}
      />
      <BirthdayPicker
        visible={birthdayOpen}
        value={draft.birthday}
        monthNames={monthNames}
        title={t('clients.form.birthday')}
        cancelLabel={t('common.cancel')}
        doneLabel={t('common.save')}
        onCancel={() => setBirthdayOpen(false)}
        onConfirm={(value) => {
          set('birthday', value);
          setBirthdayOpen(false);
        }}
      />
    </View>
  );
}

function Field({ label, ...input }: { label: string } & TextInputProps) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.field}>
      <Text variant="caption" color="tertiary">
        {label}
      </Text>
      <TextInput
        placeholderTextColor={theme.colors.content.tertiary}
        accessibilityLabel={label}
        style={styles.input}
        {...input}
      />
    </View>
  );
}

const FIELD_HEIGHT = 58;

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.elevated },
  grabber: {
    alignSelf: 'center',
    marginTop: theme.space[2],
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.border.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.space[2],
    paddingHorizontal: theme.space[4],
  },
  title: { flex: 1 },
  headerSpacer: { width: theme.sizing.iconButton },
  scroll: { flex: 1 },
  content: { paddingTop: theme.space[4.5], paddingHorizontal: theme.space[4] },
  avatarBlock: { alignItems: 'center', gap: theme.space[3] },
  avatarShadow: { borderRadius: theme.radius.full, boxShadow: theme.shadow.avatar },
  avatarEmpty: { opacity: 0.55 },
  swatches: { flexDirection: 'row', gap: theme.space[2], justifyContent: 'center' },
  swatchRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchRingOn: { borderColor: theme.colors.content.primary },
  swatch: { flex: 1, borderRadius: 12 },
  fields: { marginTop: theme.space[4.5], gap: theme.space[2] },
  field: {
    height: FIELD_HEIGHT,
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.field,
    backgroundColor: theme.colors.bg.surface,
  },
  input: {
    padding: 0,
    color: theme.colors.content.primary,
    ...theme.typography.callout,
    lineHeight: undefined,
  },
  inputMedium: { ...theme.typography.calloutMedium, lineHeight: undefined, letterSpacing: 0.3 },
  phone: {
    height: FIELD_HEIGHT,
    flexDirection: 'row',
    borderRadius: theme.radius.field,
    backgroundColor: theme.colors.bg.surface,
    overflow: 'hidden',
  },
  country: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.5],
    paddingLeft: theme.space[3.5],
    paddingRight: theme.space[3],
    borderRightWidth: 1,
    borderRightColor: theme.colors.border.default,
  },
  phoneInput: { flex: 1, justifyContent: 'center', gap: 2, paddingHorizontal: theme.space[3.5] },
  messenger: {
    height: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingLeft: theme.space[3.5],
    paddingRight: theme.space[1],
    borderRadius: theme.radius.field,
    backgroundColor: theme.colors.bg.surface,
  },
  grow: { flex: 1, minWidth: 0, gap: 2 },
  addMessengers: { marginTop: 2, gap: theme.space[2] },
  messengerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[1.5] },
  messengerChip: {
    height: theme.sizing.control.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[1.5],
    paddingLeft: theme.space[2.5],
    paddingRight: theme.space[3],
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    backgroundColor: theme.colors.bg.elevated,
  },
  medium: { fontFamily: theme.typography.bodyMedium.fontFamily },
  birthday: {
    height: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: theme.space[1],
    borderRadius: theme.radius.field,
    backgroundColor: theme.colors.bg.surface,
  },
  birthdayMain: { height: '100%', justifyContent: 'center', paddingHorizontal: theme.space[3.5] },
  vip: {
    height: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.field,
    backgroundColor: theme.colors.bg.surface,
  },
  vipTitle: { flexDirection: 'row', alignItems: 'center', gap: theme.space[1.5] },
  note: {
    minHeight: FIELD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space[3],
    padding: theme.space[3.5],
    borderRadius: theme.radius.field,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
  },
  noteInput: { minHeight: 44, textAlignVertical: 'top' },
  addNote: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingHorizontal: theme.space[3.5],
    borderRadius: theme.radius.field,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.strong,
  },
  pressed: { opacity: 0.7 },
  pickContact: {
    height: theme.sizing.control.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space[2],
  },
  footer: {
    paddingTop: theme.space[3],
    paddingHorizontal: theme.space[4],
    backgroundColor: theme.colors.bg.elevated,
  },
}));
