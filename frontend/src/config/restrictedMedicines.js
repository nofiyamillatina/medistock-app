const configuredNames = (import.meta.env.VITE_RESTRICTED_MEDICINE_NAMES || '')
  .split('|')
  .map((name) => name.trim().toLocaleLowerCase('id-ID'))
  .filter(Boolean);

export const RESTRICTED_MEDICINE_WARNING = 'Obat ini memerlukan perhatian khusus. Pastikan obat memenuhi ketentuan penjualan dan distribusi sebelum ditambahkan ke katalog.';

export const isRestrictedMedicine = (name) =>
  typeof name === 'string' && configuredNames.includes(name.trim().toLocaleLowerCase('id-ID'));
