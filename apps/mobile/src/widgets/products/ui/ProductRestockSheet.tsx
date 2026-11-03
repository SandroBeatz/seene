/**
 * "Пополнить": a purchase. How much came, what it really cost, and whether it goes to expenses.
 * The product's own stock stepper only corrects the count. Not in the design.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useMoneyContext } from '@/entities/master';
import {
  fromPackages,
  parseQuantity,
  QuantityStepper,
  toPackages,
  useProductsQuery,
  useRestockProductMutation,
  type Product,
} from '@/entities/product';
import { useUserId } from '@/entities/session';
import {
  Button,
  FormScreen,
  GroupedCard,
  Input,
  ListItem,
  SheetChrome,
  Switch,
  Text,
} from '@/shared/ui';

export function ProductRestockSheet() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const userId = useUserId() ?? '';
  const products = useProductsQuery(userId);
  const product = products.data?.find((item) => item.id === productId);
  if (!product) return null;
  return <RestockForm product={product} userId={userId} />;
}

function RestockForm({ product, userId }: { product: Product; userId: string }) {
  const { t } = useTranslation();
  const { currencyLabel, number, zone } = useMoneyContext(userId);
  const restock = useRestockProductMutation(userId);
  const [bought, setBought] = useState('1');
  // Null until typed: follows the amount at the known price.
  const [totalEdit, setTotalEdit] = useState<string | null>(null);
  const [toExpense, setToExpense] = useState(product.expense_on_restock);

  const packages = parseQuantity(bought);
  const unit = t(`menuHome.products.units.${product.unit}`);
  const known = packages !== null && product.buy_price ? packages * product.buy_price : null;
  const total = totalEdit ?? (known !== null ? String(known) : '');
  const totalValue = total.trim() ? parseQuantity(total) : null;
  const canSave = !!packages && (!total.trim() || totalValue !== null);
  const after = toPackages(
    product.stock + fromPackages(packages ?? 0, product.pack_size),
    product.pack_size,
  );

  const submit = () => {
    if (!packages) return;
    restock.mutate(
      {
        id: product.id,
        quantity: fromPackages(packages, product.pack_size),
        total: totalValue,
        toExpense,
        today: DateTime.now().setZone(zone).toISODate() ?? '',
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('actions.failedTitle'), t('actions.failedMessage')),
      },
    );
  };

  return (
    <FormScreen
      edges={['left', 'right', 'bottom']}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      footer={
        <Button
          label={t('menuHome.products.restock')}
          disabled={!canSave}
          loading={restock.isPending}
          onPress={submit}
          fullWidth
        />
      }>
      <SheetChrome title={t('menuHome.products.restockTitle')} leadingLabel={t('common.close')} />
      <Text variant="calloutMedium" numberOfLines={1} style={styles.name}>
        {product.name}
      </Text>
      <GroupedCard variant="menu">
        <View style={styles.row}>
          <View style={styles.grow}>
            <Text variant="body">{t('menuHome.products.bought')}</Text>
            <Text variant="caption" color="tertiary">
              {t('menuHome.products.willBe', { amount: `${number(after)} ${unit}` })}
            </Text>
          </View>
          <QuantityStepper
            value={bought}
            unit={unit}
            min={0.01}
            label={t('menuHome.products.bought')}
            onChange={setBought}
          />
        </View>
      </GroupedCard>
      <Input
        variant="filled"
        label={t('menuHome.products.paid')}
        placeholder="0"
        keyboardType="decimal-pad"
        value={total}
        onChangeText={setTotalEdit}
        suffix={currencyLabel}
      />
      <GroupedCard variant="menu">
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
  name: { marginHorizontal: theme.space[1] },
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space[3],
    paddingVertical: theme.space[2],
  },
  grow: { flex: 1, minWidth: 0 },
}));
