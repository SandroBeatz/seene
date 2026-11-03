/**
 * A grey card of rows the master reorders by holding one (the services of a category,
 * the categories of a direction). A tap opens the row; the order is reported on drop.
 */
import { useCallback, type ReactNode } from 'react';
import { View } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import Sortable from 'react-native-sortables';
import { StyleSheet } from 'react-native-unistyles';

const HOLD_MS = 250;

export interface ReorderCardProps<T extends { id: string }> {
  items: T[];
  scrollableRef: AnimatedRef<any>;
  renderRow: (item: T) => ReactNode;
  onPress: (item: T) => void;
  onReorder: (ids: string[]) => void;
  /** Under the rows, not dragged ("Новая категория"). */
  footer?: ReactNode;
}

export function ReorderCard<T extends { id: string }>({
  items,
  scrollableRef,
  renderRow,
  onPress,
  onReorder,
  footer,
}: ReorderCardProps<T>) {
  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      // The row carries its own background, to stay readable while lifted over the others,
      // so the card's first and last rows take its corners.
      <Sortable.Touchable
        onTap={() => onPress(item)}
        style={[
          styles.row,
          index === 0 && styles.first,
          index === items.length - 1 && !footer && styles.last,
        ]}>
        <View style={index > 0 && styles.divided}>{renderRow(item)}</View>
      </Sortable.Touchable>
    ),
    [onPress, renderRow, items.length, footer],
  );
  return (
    <View style={styles.card}>
      <Sortable.Grid
        columns={1}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollableRef={scrollableRef}
        dragActivationDelay={HOLD_MS}
        activeItemScale={1.02}
        inactiveItemOpacity={1}
        overDrag="vertical"
        onDragEnd={({ data, fromIndex, toIndex }) => {
          if (fromIndex !== toIndex) onReorder(data.map((item) => item.id));
        }}
      />
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.bg.surface,
    borderRadius: theme.radius.xl,
  },
  row: { backgroundColor: theme.colors.bg.surface, paddingHorizontal: theme.space[3.5] },
  first: { borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl },
  last: { borderBottomLeftRadius: theme.radius.xl, borderBottomRightRadius: theme.radius.xl },
  footer: { paddingHorizontal: theme.space[3.5] },
  divided: { borderTopWidth: 1, borderTopColor: theme.colors.border.default },
}));
