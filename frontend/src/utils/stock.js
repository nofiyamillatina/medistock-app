export const isValidStockInput = (value) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0 && !Object.is(value, -0);
  }
  return typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value));
};

export const getDisplayStock = (value) => {
  const stock = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(stock) && stock >= 0 && !Object.is(stock, -0) ? stock : 0;
};

export const STOCK_VALIDATION_MESSAGE = 'Stok harus berupa angka bulat minimal 0.';
