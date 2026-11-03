/**
 * "Портфолио" (design AppMenuPortfolio). A tap opens the photo; holding one opens its menu.
 * Dragging is a mode of its own, chosen in that menu: on the plain grid a hold can't mean
 * both, and a filtered grid has no order to change.
 */
import { router, Stack } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { Image } from 'expo-image';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import {
  masterPageLabel,
  useMasterProfileQuery,
  useMasterSettingsQuery,
  useUpdateMasterSettings,
} from '@/entities/master';
import {
  useAddPortfolioPhotosMutation,
  useDeletePortfolioItemMutation,
  usePortfolioQuery,
  useReorderPortfolioMutation,
  type PortfolioItem,
} from '@/entities/portfolio';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import { pickImages } from '@/shared/lib/image-picker';
import {
  Button,
  Chip,
  ChipRow,
  ContextMenu,
  EmptyState,
  ErrorState,
  GroupedCard,
  IconButton,
  ListItem,
  Skeleton,
  Switch,
  Text,
  type ContextMenuAnchor,
} from '@/shared/ui';
import { filterPhotos, portfolioFilters } from '../lib/filters';
import { PhotoTile } from './PhotoTile';

const COLUMNS = 3;
const GAP = 6;
const HOLD_MS = 150;
/** At most this many at once: they upload one by one over a phone's connection. */
const PICK_LIMIT = 10;
/** The lifted photo, as wide as the menu under it. */
const MENU_WIDTH = 264;

export function PortfolioScreen() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const screen = useWindowDimensions();
  const userId = useUserId() ?? '';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  const portfolio = usePortfolioQuery(userId);
  const profile = useMasterProfileQuery(userId);
  const settings = useMasterSettingsQuery(userId);
  const services = useServicesQuery(userId);
  const updateSettings = useUpdateMasterSettings(userId);
  const add = useAddPortfolioPhotosMutation(userId);
  const remove = useDeletePortfolioItemMutation(userId);
  const reorder = useReorderPortfolioMutation(userId);

  const [filter, setFilter] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [menu, setMenu] = useState<{ item: PortfolioItem; anchor: ContextMenuAnchor } | null>(null);
  const tiles = useRef(new Map<string, View | null>());

  const failed = () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));

  const pickAndAdd = async () => {
    const images = await pickImages(PICK_LIMIT);
    if (images.length) add.mutate(images, { onError: failed });
  };

  const openPhoto = (item: PortfolioItem, focus?: 'caption') =>
    router.push({ pathname: '/portfolio/[itemId]', params: { itemId: item.id, focus } });

  const confirmDelete = (item: PortfolioItem) =>
    Alert.alert(t('menuHome.portfolio.deleteTitle'), t('menuHome.portfolio.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => remove.mutate(item, { onError: failed }),
      },
    ]);

  const openMenu = (item: PortfolioItem) =>
    tiles.current.get(item.id)?.measureInWindow((_x, y) =>
      setMenu({
        item,
        anchor: { x: (screen.width - MENU_WIDTH) / 2, y, width: MENU_WIDTH },
      }),
    );

  const selectMenu = (key: string) => {
    if (!menu) return;
    if (key === 'caption') openPhoto(menu.item, 'caption');
    else if (key === 'service') openPhoto(menu.item);
    else if (key === 'order') {
      setFilter(null);
      setOrdering(true);
    } else if (key === 'delete') confirmDelete(menu.item);
  };

  const size = (screen.width - theme.layout.gutter * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  const items = portfolio.data ?? [];
  const serviceList = services.data ?? [];
  const showOnPage = settings.data?.show_portfolio ?? true;
  // The page falls back to the first photo only when no cover was chosen in the profile.
  const coverId = showOnPage && profile.data && !profile.data.cover_url ? items[0]?.id : undefined;
  const filters = portfolioFilters(items, serviceList);
  const activeFilter = filters.some((f) => f.specialization === filter) ? filter : null;
  const visible = filterPhotos(items, serviceList, activeFilter);
  const canOrder = ordering && items.length > 1;

  const renderSortable = useCallback(
    ({ item }: { item: PortfolioItem }) => (
      <PhotoTile uri={item.photo_url} size={size} caption={item.caption} />
    ),
    [size],
  );

  if (portfolio.isError) {
    return (
      <ErrorState
        message={t(errorMessageKey(normalizeError(portfolio.error)))}
        onRetry={() => void portfolio.refetch()}
      />
    );
  }

  const headerAction = canOrder ? (
    process.env.EXPO_OS === 'ios' ? (
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          variant="prominent"
          tintColor={theme.colors.content.primary}
          onPress={() => setOrdering(false)}>
          {t('common.done')}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
    ) : (
      <Stack.Screen
        options={{
          headerRight: () => (
            <Button label={t('common.done')} size="sm" onPress={() => setOrdering(false)} />
          ),
        }}
      />
    )
  ) : process.env.EXPO_OS === 'ios' ? (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon="plus"
        variant="prominent"
        tintColor={theme.colors.content.primary}
        accessibilityLabel={t('menuHome.portfolio.addA11y')}
        disabled={add.isPending}
        onPress={() => void pickAndAdd()}
      />
    </Stack.Toolbar>
  ) : (
    <Stack.Screen
      options={{
        headerRight: () => (
          <IconButton
            icon="add"
            variant="accent"
            accessibilityLabel={t('menuHome.portfolio.addA11y')}
            disabled={add.isPending}
            onPress={() => void pickAndAdd()}
          />
        ),
      }}
    />
  );

  const uploading = add.isPending ? add.variables.length : 0;
  const link = profile.data ? masterPageLabel(profile.data.username) : '';

  return (
    <>
      {headerAction}
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.root}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <GroupedCard variant="menu">
          <ListItem
            size="menu"
            inset={false}
            title={t('menuHome.portfolio.show')}
            right={
              <Switch
                value={showOnPage}
                onValueChange={(show_portfolio) =>
                  updateSettings.mutate({ show_portfolio }, { onError: failed })
                }
                accessibilityLabel={t('menuHome.portfolio.show')}
              />
            }
          />
        </GroupedCard>
        <Text variant="caption" color="tertiary" style={styles.hint}>
          {coverId
            ? t('menuHome.portfolio.showHintCover', { link })
            : t('menuHome.portfolio.showHint', { link })}
        </Text>

        {portfolio.isPending ? (
          <View style={styles.grid}>
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} width={size} height={size} radius={theme.radius.md} />
            ))}
          </View>
        ) : items.length === 0 && !uploading ? (
          <EmptyState
            icon="gallery"
            title={t('menuHome.portfolio.emptyTitle')}
            description={t('menuHome.portfolio.emptyText')}
            actionLabel={t('menuHome.portfolio.add')}
            onAction={() => void pickAndAdd()}
          />
        ) : canOrder ? (
          <View style={styles.ordering}>
            <Sortable.Grid
              columns={COLUMNS}
              rowGap={GAP}
              columnGap={GAP}
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderSortable}
              scrollableRef={scrollRef}
              dragActivationDelay={HOLD_MS}
              activeItemScale={1.05}
              inactiveItemOpacity={1}
              onDragEnd={({ data, fromIndex, toIndex }) => {
                if (fromIndex !== toIndex) {
                  reorder.mutate(
                    data.map((item) => item.id),
                    { onError: failed },
                  );
                }
              }}
            />
            <Text variant="caption" color="tertiary" align="center" style={styles.footnote}>
              {t('menuHome.portfolio.orderHint')}
            </Text>
          </View>
        ) : (
          <>
            {filters.length ? (
              <View style={styles.chips}>
                <ChipRow>
                  <Chip
                    size="filter"
                    shape="pill"
                    label={t('menuHome.portfolio.all', { count: items.length })}
                    selected={!activeFilter}
                    onPress={() => setFilter(null)}
                  />
                  {filters.map((f) => (
                    <Chip
                      key={f.specialization}
                      size="filter"
                      shape="pill"
                      label={`${t(`onboarding.specializations.${f.specialization}`)} ${f.count}`}
                      selected={activeFilter === f.specialization}
                      onPress={() => setFilter(f.specialization)}
                    />
                  ))}
                </ChipRow>
              </View>
            ) : null}
            <View style={styles.grid}>
              {visible.map((item) => (
                <Pressable
                  key={item.id}
                  ref={(node) => {
                    tiles.current.set(item.id, node);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item.caption
                      ? t('menuHome.portfolio.photoNamed', { caption: item.caption })
                      : t('menuHome.portfolio.photo')
                  }
                  accessibilityActions={[
                    { name: 'longpress', label: t('menuHome.portfolio.menuA11y') },
                  ]}
                  onAccessibilityAction={() => openMenu(item)}
                  onPress={() => openPhoto(item)}
                  onLongPress={() => openMenu(item)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <PhotoTile
                    uri={item.photo_url}
                    size={size}
                    caption={item.caption}
                    coverLabel={item.id === coverId ? t('menuHome.portfolio.cover') : undefined}
                  />
                </Pressable>
              ))}
              {Array.from({ length: uploading }, (_, key) => (
                <Skeleton key={key} width={size} height={size} radius={theme.radius.md} />
              ))}
            </View>
            <Text variant="caption" color="tertiary" align="center" style={styles.footnote}>
              {t('menuHome.portfolio.holdHint')}
            </Text>
          </>
        )}
      </Animated.ScrollView>

      <ContextMenu
        anchor={menu?.anchor ?? null}
        preview={
          menu ? (
            <Image source={{ uri: menu.item.photo_url }} style={styles.lifted} contentFit="cover" />
          ) : undefined
        }
        items={[
          { key: 'caption', label: t('menuHome.portfolio.caption'), icon: 'text' },
          { key: 'service', label: t('menuHome.portfolio.linkService'), icon: 'tag' },
          ...(items.length > 1
            ? [{ key: 'order', label: t('menuHome.portfolio.changeOrder'), icon: 'menu' as const }]
            : []),
          { key: 'delete', label: t('common.delete'), icon: 'trash', danger: true },
        ]}
        closeLabel={t('common.close')}
        onClose={() => setMenu(null)}
        onSelect={selectMenu}
      />
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[3.5],
    paddingBottom: theme.space[10],
  },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
  chips: { marginTop: theme.space[4.5] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: theme.space[3] },
  ordering: { marginTop: theme.space[4.5] },
  footnote: { marginTop: theme.space[3] },
  pressed: { opacity: 0.8 },
  lifted: { width: MENU_WIDTH, height: MENU_WIDTH, borderRadius: theme.radius.lg },
}));
