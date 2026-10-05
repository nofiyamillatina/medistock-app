export const normalizeStockInput = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const stock = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(stock) || stock <= 0) return 0;
  return Math.min(Math.floor(stock), Number.MAX_SAFE_INTEGER);
};

export const isValidStockInput = (value) => {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0);
};

export const getDisplayStock = normalizeStockInput;

export const STOCK_VALIDATION_MESSAGE = 'Stok harus berupa angka bulat minimal 0.';
