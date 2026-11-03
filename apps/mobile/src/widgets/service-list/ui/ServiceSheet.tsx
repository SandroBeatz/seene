/**
 * "Новая услуга" / "Услуга" (design AppSvcNew, AppSvcEdit). "Удалить" archives the
 * service. A new category is typed right here, so the unsaved form stays on screen.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useMasterProfileQuery, useMoneyContext } from '@/entities/master';
import {
  useArchiveServiceMutation,
  useCreateServiceMutation,
  useServicesQuery,
  useUpdateServiceMutation,
  type ServiceWithCategory,
} from '@/entities/service';
import {
  useCreateServiceCategoryMutation,
  useServiceCategoriesQuery,
} from '@/entities/service-category';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { formatDurationLabel } from '@/shared/lib/i18n';
import {
  ChipRow,
  Button,
  Chip,
  DurationPicker,
  ErrorState,
  FormScreen,
  GroupedCard,
  Input,
  ListItem,
  SheetChrome,
  Skeleton,
  Switch,
  Text,
} from '@/shared/ui';
import {
  BUFFER_OPTIONS,
  colorAfterDirectionChange,
  directionColor,
  DURATION_PRESETS,
  nextSortOrder,
  parsePrice,
} from '../lib/draft';
import { directionOrder } from '../lib/grouping';

const PRESETS: readonly number[] = DURATION_PRESETS;

export function ServiceSheet({ serviceId }: { serviceId?: string }) {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const services = useServicesQuery(userId);
  const profile = useMasterProfileQuery(userId);
  const service = services.data?.find((row) => row.id === serviceId);
  const loadError = (!services.data && services.error) || (!profile.data && profile.error);
  if (loadError) {
    return (
      <ErrorState
        message={t(errorMessageKey(normalizeError(loadError)))}
        onRetry={() => {
          void services.refetch();
          void profile.refetch();
        }}
      />
    );
  }
  if (!services.data || !profile.data || (serviceId && !service)) {
    return (
      <View style={styles.loading}>
        <Skeleton height={320} />
      </View>
    );
  }
  return (
    <ServiceForm
      service={service}
      all={services.data}
      mine={profile.data.specializations ?? []}
      userId={userId}
    />
  );
}

function ServiceForm({
  service,
  all,
  mine,
  userId,
}: {
  service?: ServiceWithCategory;
  all: ServiceWithCategory[];
  mine: string[];
  userId: string;
}) {
  const { t } = useTranslation();
  const money = useMoneyContext(userId);
  const categories = useServiceCategoriesQuery(userId);
  const create = useCreateServiceMutation(userId);
  const update = useUpdateServiceMutation(userId);
  const archive = useArchiveServiceMutation(userId);
  const createCategory = useCreateServiceCategoryMutation(userId);

  const [name, setName] = useState(service?.name ?? '');
  const [specialization, setSpecialization] = useState<string | null>(
    service ? service.specialization : (mine[0] ?? null),
  );
  const [color, setColor] = useState(service?.color ?? directionColor(mine[0] ?? null));
  const [categoryId, setCategoryId] = useState<string | null>(service?.category_id ?? null);
  const [duration, setDuration] = useState(service?.duration ?? 60);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [price, setPrice] = useState(service?.price ? String(service.price) : '');
  const [priceFrom, setPriceFrom] = useState(service?.price_from ?? false);
  const [online, setOnline] = useState(service?.show_online ?? true);
  const [buffer, setBuffer] = useState(service?.buffer_after_minutes ?? 0);
  const [bufferOpen, setBufferOpen] = useState(false);
  const [description, setDescription] = useState(service?.description ?? '');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  const failed = () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));
  const parsedPrice = parsePrice(price);
  const canSave = name.trim().length > 0 && parsedPrice !== null && duration > 0;
  const saving = create.isPending || update.isPending;
  const custom = !PRESETS.includes(duration);

  const directions = directionOrder(mine, [{ specialization }]);
  const offered = (categories.data ?? []).filter(
    (c) => c.specialization === null || c.specialization === specialization,
  );

  const pickDirection = (next: string) => {
    if (next === specialization) return;
    setColor((current) => colorAfterDirectionChange(current, specialization, next));
    setSpecialization(next);
    const category = categories.data?.find((c) => c.id === categoryId);
    if (category?.specialization && category.specialization !== next) setCategoryId(null);
  };

  const addCategory = () => {
    const value = categoryName.trim();
    if (!value) return;
    const existing = offered.find((c) => c.name.toLowerCase() === value.toLowerCase());
    const done = (id: string) => {
      setCategoryId(id);
      setCategoryName('');
      setCategoryOpen(false);
    };
    if (existing) return done(existing.id);
    createCategory.mutate(
      {
        name: value,
        specialization,
        sort_order: nextSortOrder(categories.data ?? []),
      },
      { onSuccess: (category) => done(category.id), onError: failed },
    );
  };

  const save = () => {
    if (!canSave) return;
    const dto = {
      name: name.trim(),
      specialization,
      category_id: categoryId,
      duration,
      price: parsedPrice,
      price_from: priceFrom,
      show_online: online,
      buffer_after_minutes: buffer,
      description: description.trim() || null,
      color,
    };
    const options = { onSuccess: () => router.back(), onError: failed };
    if (service) update.mutate({ id: service.id, ...dto }, options);
    else create.mutate({ ...dto, sort_order: nextSortOrder(all) }, options);
  };

  const confirmDelete = () =>
    Alert.alert(t('menuHome.servicesPage.deleteTitle'), t('menuHome.servicesPage.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('menuHome.servicesPage.delete'),
        style: 'destructive',
        onPress: () =>
          service &&
          archive.mutate(service.id, { onSuccess: () => router.back(), onError: failed }),
      },
    ]);

  const bufferLabel = (minutes: number) =>
    minutes ? formatDurationLabel(minutes, t) : t('menuHome.servicesPage.bufferNone');

  return (
    <>
      <FormScreen
        edges={['left', 'right', 'bottom']}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        footer={
          <Button
            label={service ? t('menuHome.servicesPage.save') : t('menuHome.servicesPage.add')}
            disabled={!canSave}
            loading={saving}
            onPress={save}
            fullWidth
          />
        }>
        <SheetChrome
          title={
            service ? t('menuHome.servicesPage.titleEdit') : t('menuHome.servicesPage.titleNew')
          }
          leadingLabel={t('common.close')}
          action={
            service
              ? {
                  key: 'delete',
                  label: t('menuHome.servicesPage.delete'),
                  sf: 'trash',
                  icon: 'trash',
                  destructive: true,
                  onPress: confirmDelete,
                }
              : undefined
          }
        />

        <Input
          variant="filled"
          label={t('menuHome.servicesPage.name')}
          placeholder={t('menuHome.servicesPage.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
          autoFocus={!service}
        />

        <FieldLabel text={t('menuHome.servicesPage.direction')} />
        <ChipRow>
          {directions.map((key) => (
            <Chip
              key={key}
              size="filter"
              shape="pill"
              label={t(`onboarding.specializations.${key}`)}
              selected={specialization === key}
              onPress={() => pickDirection(key)}
            />
          ))}
          <Chip
            size="filter"
            shape="pill"
            label={t('menuHome.servicesPage.newDirection')}
            onPress={() => router.push('/settings/specializations')}
          />
        </ChipRow>

        <FieldLabel text={t('menuHome.servicesPage.category')} />
        <ChipRow>
          {offered.map((category) => (
            <Chip
              key={category.id}
              size="filter"
              shape="pill"
              label={category.name}
              selected={categoryId === category.id}
              // A second tap takes the category off: it is optional.
              onPress={() => setCategoryId(categoryId === category.id ? null : category.id)}
            />
          ))}
          <Chip
            size="filter"
            shape="pill"
            label={t('menuHome.servicesPage.newCategory')}
            active={categoryOpen}
            onPress={() => setCategoryOpen(!categoryOpen)}
          />
        </ChipRow>
        {categoryOpen ? (
          <View style={styles.newCategory}>
            <View style={styles.newCategoryInput}>
              <Input
                variant="filled"
                accessibilityLabel={t('menuHome.servicesPage.categoryPlaceholder')}
                placeholder={t('menuHome.servicesPage.categoryPlaceholder')}
                value={categoryName}
                onChangeText={setCategoryName}
                autoCapitalize="sentences"
                autoFocus
                onSubmitEditing={addCategory}
              />
            </View>
            <Button
              label={t('menuHome.servicesPage.categoryAdd')}
              disabled={!categoryName.trim()}
              loading={createCategory.isPending}
              onPress={addCategory}
            />
          </View>
        ) : null}

        <FieldLabel text={t('menuHome.servicesPage.duration')} />
        <ChipRow>
          {DURATION_PRESETS.map((minutes) => (
            <Chip
              key={minutes}
              size="filter"
              shape="pill"
              label={formatDurationLabel(minutes, t)}
              selected={duration === minutes}
              onPress={() => setDuration(minutes)}
            />
          ))}
          <Chip
            size="filter"
            shape="pill"
            label={
              custom ? formatDurationLabel(duration, t) : t('menuHome.servicesPage.durationCustom')
            }
            selected={custom}
            onPress={() => setPickerOpen(true)}
          />
        </ChipRow>

        <View style={styles.price}>
          <Input
            variant="filled"
            label={t('menuHome.servicesPage.price')}
            placeholder="0"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            inputMode="decimal"
            suffix={money.currencyLabel}
          />
        </View>

        <View style={styles.card}>
          <GroupedCard variant="menu">
            <ListItem
              size="menu"
              inset={false}
              title={t('menuHome.servicesPage.priceFromLabel')}
              subtitle={t('menuHome.servicesPage.priceFromHint')}
              right={
                <Switch
                  value={priceFrom}
                  onValueChange={setPriceFrom}
                  accessibilityLabel={t('menuHome.servicesPage.priceFromLabel')}
                />
              }
            />
            <ListItem
              size="menu"
              inset={false}
              title={t('menuHome.servicesPage.showOnline')}
              right={
                <Switch
                  value={online}
                  onValueChange={setOnline}
                  accessibilityLabel={t('menuHome.servicesPage.showOnline')}
                />
              }
            />
            <ListItem
              size="menu"
              inset={false}
              title={t('menuHome.servicesPage.bufferAfter')}
              trailingText={bufferLabel(buffer)}
              onPress={() => setBufferOpen(!bufferOpen)}
            />
          </GroupedCard>
        </View>
        {bufferOpen ? (
          <View style={styles.bufferRow}>
            <ChipRow>
              {BUFFER_OPTIONS.map((minutes) => (
                <Chip
                  key={minutes}
                  size="filter"
                  shape="pill"
                  label={bufferLabel(minutes)}
                  selected={buffer === minutes}
                  onPress={() => {
                    setBuffer(minutes);
                    setBufferOpen(false);
                  }}
                />
              ))}
            </ChipRow>
          </View>
        ) : null}

        <View style={styles.description}>
          <Input
            variant="filled"
            label={t('menuHome.servicesPage.description')}
            placeholder={t('menuHome.servicesPage.descriptionPlaceholder')}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
      </FormScreen>

      <DurationPicker
        visible={pickerOpen}
        value={duration}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(minutes) => {
          setDuration(minutes);
          setPickerOpen(false);
        }}
        title={t('menuHome.servicesPage.pickerTitle')}
        cancelLabel={t('menuHome.servicesPage.pickerCancel')}
        doneLabel={t('menuHome.servicesPage.pickerDone')}
        hoursUnit={t('menuHome.servicesPage.hoursUnit')}
        minutesUnit={t('menuHome.servicesPage.minutesUnit')}
      />
    </>
  );
}

function FieldLabel({ text }: { text: string }) {
  return (
    <Text variant="captionMedium" color="secondary" style={styles.fieldLabel}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create((theme) => ({
  loading: { padding: theme.layout.gutter },
  content: { paddingTop: theme.space[2], paddingBottom: theme.space[6] },
  fieldLabel: {
    marginTop: theme.space[4.5],
    marginBottom: theme.space[2],
    marginHorizontal: theme.space[1],
  },
  newCategory: {
    marginTop: theme.space[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[2],
  },
  newCategoryInput: { flex: 1, minWidth: 0 },
  price: { marginTop: theme.space[4.5] },
  card: { marginTop: theme.space[3.5] },
  bufferRow: { marginTop: theme.space[2] },
  description: { marginTop: theme.space[3.5] },
}));
