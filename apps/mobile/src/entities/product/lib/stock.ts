/** "Заканчивается": below the master's threshold. A threshold of 0 never warns. */
export const isLowStock = (product: { stock: number; low_stock: number }) =>
  product.stock < product.low_stock;
