/** A new product or an existing one (design AppProdNew, AppProdEdit). */
import { router, useLocalSearchParams } from 'expo-router';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useMasterSettingsQuery, useMoneyContext } from '@/entities/master';
import {
  PRODUCT_TYPES,
  PRODUCT_UNITS,
  useDeleteProductMutation,
  useProductsQuery,
  useSaveProductMutation,
  type Product,
  type ProductType,
  type ProductUnit,
} from '@/entities/product';
import { useServicesQuery } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { currencySymbol } from '@/shared/lib/formats';
import {
  Button,
  Chip,
  ChipRow,
  FormScreen,
  GroupedCard,
  Icon,
  Input,
  ListItem,
  SheetChrome,
  Switch,
  Text,
} from '@/shared/ui';
import { linkedSummary, parseQuantity, stockDelta } from '../lib/products';
import { useProductLinks } from '../model/links.store';
import { QuantityStepper } from './QuantityStepper';

/** The design's threshold on a new product. */
const DEFAULT_LOW_STOCK = 5;

export function ProductSheet() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const userId = useUserId() ?? '';
  const products = useProductsQuery(userId);
  if (productId && !products.data) return null;
  const product = products.data?.find((item) => item.id === productId);
  // Deleted while open: the sheet is on its way out.
  if (productId && !product) return null;
  return <ProductForm key={productId ?? 'new'} product={product} userId={userId} />;
}

function ProductForm({ product, userId }: { product?: Product; userId: string }) {
  const { t } = useTranslation();
  const settings = useMasterSettingsQuery(userId);
  const { zone, locale } = useMoneyContext(userId);
  const services = useServicesQuery(userId);
  const save = useSaveProductMutation(userId);
  const remove = useDeleteProductMutation(userId);

  const [name, setName] = useState(product?.name ?? '');
  const [type, setType] = useState<ProductType>((product?.type as ProductType) ?? 'sale');
  const [unit, setUnit] = useState<ProductUnit>((product?.unit as ProductUnit) ?? 'pcs');
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [lowStock, setLowStock] = useState(String(product?.low_stock ?? DEFAULT_LOW_STOCK));
  const [buy, setBuy] = useState(product?.buy_price?.toString() ?? '');
  const [sell, setSell] = useState(product?.sell_price?.toString() ?? '');
  const [toExpense, setToExpense] = useState(product?.expense_on_restock ?? true);

  const links = useProductLinks((s) => s.links);
  const beginLinks = useProductLinks((s) => s.begin);
  useEffect(() => {
    beginLinks(
      Object.fromEntries((product?.services ?? []).map((s) => [s.service_id, String(s.quantity)])),
    );
  }, [product?.id, beginLinks]); // eslint-disable-line react-hooks/exhaustive-deps

  const failed = () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage'));
  const options = { onSuccess: () => router.back(), onError: failed };

  const stockValue = parseQuantity(stock);
  const lowValue = parseQuantity(lowStock);
  const priceOf = (text: string) => (text.trim() ? parseQuantity(text) : null);
  const pricesValid =
    (!buy.trim() || priceOf(buy) !== null) && (!sell.trim() || priceOf(sell) !== null);
  const linkList = Object.entries(links).map(([service_id, quantity]) => ({
    service_id,
    quantity: parseQuantity(quantity),
  }));
  const linksValid = linkList.every((link) => link.quantity !== null && link.quantity > 0);
  const canSave =
    !!name.trim() && stockValue !== null && lowValue !== null && pricesValid && linksValid;

  const submit = () => {
    if (stockValue === null || lowValue === null) return;
    save.mutate(
      {
        id: product?.id,
        name: name.trim(),
        type,
        unit,
        stockDelta: stockDelta(stockValue, product?.stock ?? 0),
        lowStock: lowValue,
        buyPrice: priceOf(buy),
        sellPrice: priceOf(sell),
        expenseOnRestock: toExpense,
        services: linkList.map((link) => ({
          service_id: link.service_id,
          quantity: link.quantity ?? 1,
        })),
        today: DateTime.now().setZone(zone).toISODate() ?? '',
      },
      options,
    );
  };

  const confirmDelete = () =>
    Alert.alert(t('menuHome.products.deleteTitle'), t('menuHome.products.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => product && remove.mutate(product.id, options),
      },
    ]);

  const linkedNames = (services.data ?? [])
    .filter((service) => links[service.id] !== undefined)
    .map((service) => service.name);
  const currency = currencySymbol(settings.data?.currency ?? 'EUR', locale);
  const unitLabel = t(`menuHome.products.units.${unit}`);

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <Button
          label={product ? t('common.save') : t('menuHome.products.addSubmit')}
          disabled={!canSave}
          loading={save.isPending}
          onPress={submit}
          fullWidth
        />
      }>
      <SheetChrome
        title={product ? t('menuHome.products.editTitle') : t('menuHome.products.newTitle')}
        leadingLabel={t('common.close')}
        action={
          product
            ? {
                key: 'delete',
                label: t('common.delete'),
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
        label={t('menuHome.products.name')}
        placeholder={t('menuHome.products.namePlaceholder')}
        value={name}
        onChangeText={setName}
        maxLength={120}
        autoCapitalize="sentences"
      />

      <View style={styles.block}>
        <Text variant="captionMedium" color="secondary" style={styles.caption}>
          {t('menuHome.products.type')}
        </Text>
        <ChipRow>
          {PRODUCT_TYPES.map((key) => (
            <Chip
              key={key}
              size="filter"
              shape="pill"
              label={t(`menuHome.products.types.${key}`)}
              selected={type === key}
              onPress={() => setType(key)}
            />
          ))}
        </ChipRow>
      </View>

      <View style={styles.block}>
        <Text variant="captionMedium" color="secondary" style={styles.caption}>
          {t('menuHome.products.unit')}
        </Text>
        <ChipRow>
          {PRODUCT_UNITS.map((key) => (
            <Chip
              key={key}
              size="filter"
              shape="pill"
              label={t(`menuHome.products.units.${key}`)}
              selected={unit === key}
              onPress={() => setUnit(key)}
            />
          ))}
        </ChipRow>
      </View>

      <GroupedCard variant="menu">
        <View style={styles.stockRow}>
          <View style={styles.grow}>
            <Text variant="body">{t('menuHome.products.stock')}</Text>
            <Text variant="caption" color="tertiary">
              {t('menuHome.products.stockHint')}
            </Text>
          </View>
          <QuantityStepper
            value={stock}
            unit={unitLabel}
            label={t('menuHome.products.stock')}
            onChange={setStock}
          />
        </View>
        <View style={[styles.stockRow, styles.separator]}>
          <View style={styles.grow}>
            <Text variant="body">{t('menuHome.products.lowStock')}</Text>
            <Text variant="caption" color="tertiary">
              {t('menuHome.products.lowStockHint')}
            </Text>
          </View>
          <QuantityStepper
            value={lowStock}
            unit={unitLabel}
            label={t('menuHome.products.lowStock')}
            onChange={setLowStock}
          />
        </View>
      </GroupedCard>

      <View style={styles.prices}>
        <View style={styles.grow}>
          <Input
            variant="filled"
            label={t('menuHome.products.buy')}
            placeholder="0"
            keyboardType="decimal-pad"
            value={buy}
            onChangeText={setBuy}
            suffix={currency}
          />
        </View>
        <View style={styles.grow}>
          <Input
            variant="filled"
            label={t('menuHome.products.sell')}
            placeholder="0"
            keyboardType="decimal-pad"
            value={sell}
            onChangeText={setSell}
            suffix={currency}
          />
        </View>
      </View>

      <GroupedCard variant="menu">
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/product/services')}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}>
          <Text variant="body">{t('menuHome.products.useOn')}</Text>
          <Text
            variant="footnote"
            color="tertiary"
            numberOfLines={1}
            align="right"
            style={styles.grow}>
            {linkedSummary(linkedNames) || t('menuHome.products.useOnNone')}
          </Text>
          <Icon name="chevronRight" size="sm" color="content.tertiary" />
        </Pressable>
        <ListItem
          size="menu"
          inset={false}
          title={t('menuHome.products.toExpense')}
          subtitle={t('menuHome.products.toExpenseHint')}
          right={
            <Switch
              value={toExpense}
              onValueChange={setToExpense}
              accessibilityLabel={t('menuHome.products.toExpense')}
            />
          }
        />
      </GroupedCard>
    </FormScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  content: { paddingTop: theme.space[2], gap: theme.space[4] },
  block: { gap: theme.space[2] },
  caption: { marginLeft: theme.space[1] },
  stockRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[2],
  },
  separator: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
  grow: { flex: 1, minWidth: 0 },
  prices: { flexDirection: 'row', gap: theme.space[2.5] },
  linkRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
  },
  pressed: { opacity: 0.6 },
}));
