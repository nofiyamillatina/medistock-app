import React from 'react';
import { Check, ChevronDown, ImagePlus, Pencil, Trash2 } from 'lucide-react';
import { normalizeStockInput } from '../../utils/stock.js';
import { isRestrictedMedicine, RESTRICTED_MEDICINE_WARNING } from '../../config/restrictedMedicines.js';
import { formatIDR } from '../../services/formatters.js';

async function compressMedicineImage(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format gambar harus JPEG, PNG, atau WebP.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Ukuran gambar maksimal 10 MB.');
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();
    const qualities = [0.82, 0.72, 0.62, 0.52];
    for (const maxDimension of [1200, 1000, 800]) {
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Browser tidak dapat memproses gambar ini.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of qualities) {
        const imageUrl = canvas.toDataURL('image/webp', quality);
        if (imageUrl.length <= 1_400_000) return imageUrl;
      }
    }
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
  throw new Error('Gambar tidak dapat dikompres ke ukuran yang didukung. Pilih gambar yang lebih kecil.');
}

function normalizeMedicineIdentity(name) {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('id')
    .replace(/(\d+(?:[.,]\d+)?)\s*(micrograms?|mcg|μg|ug|milligrams?|mg|grams?|g)\b/gi, (_, rawValue, rawUnit) => {
      const value = Number(rawValue.replace(',', '.'));
      const unit = rawUnit.toLocaleLowerCase('id');
      const milligrams = /^(?:g|gram|grams)$/.test(unit)
        ? value * 1000
        : /^(?:mcg|μg|ug|microgram|micrograms)$/.test(unit)
          ? value / 1000
          : value;
      return `${Number(milligrams.toPrecision(8))}mg`;
    })
    .replace(/[^a-z0-9]/g, '');
}

export default function InventoryTab({
  inventoryDraft = [],
  onSaveInventory,
  loadingMedicines = false,
  errorMedicines = null,
  onRetryMedicines,
  onAddMedicine,
  onDeleteMedicine,
  savingInventory = false,
  deletingMedicineId = null,
  canManageInventory = false
}) {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingMedicine, setEditingMedicine] = React.useState(null);
  const [editForm, setEditForm] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', desc: '', price: '', stock: 0, image_url: '' });
  const [formError, setFormError] = React.useState('');
  const [imageFileName, setImageFileName] = React.useState('');
  const [preparingImage, setPreparingImage] = React.useState(false);
  const [sortBy, setSortBy] = React.useState('id');
  const [sortDirection, setSortDirection] = React.useState('asc');
  const [showSortOptions, setShowSortOptions] = React.useState(false);
  const sortedInventory = React.useMemo(() => [...inventoryDraft].sort((a, b) => {
    const left = sortBy === 'name' ? a.name : a.id;
    const right = sortBy === 'name' ? b.name : b.id;
    const comparison = String(left ?? '').localeCompare(String(right ?? ''), 'id', { numeric: true, sensitivity: 'base' });
    return sortDirection === 'asc' ? comparison : -comparison;
  }), [inventoryDraft, sortBy, sortDirection]);
  React.useEffect(() => {
    if (!showAddForm && !editingMedicine) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !savingInventory && !deletingMedicineId) {
        setShowAddForm(false);
        setEditingMedicine(null);
        setEditForm(null);
        setFormError('');
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showAddForm, editingMedicine, savingInventory, deletingMedicineId]);
  const handleStockKeyDown = (event, currentStock, setStock) => {
    if (event.ctrlKey || event.metaKey || event.altKey || ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    if (/^[0-9]$/.test(event.key)) {
      if (normalizeStockInput(currentStock) === 0 && event.key !== '0') {
        event.preventDefault();
        setStock(Number(event.key));
      }
      return;
    }
    event.preventDefault();
  };

  const handleStockPaste = (event, setStock) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text');
    if (/^\d+$/.test(pasted)) setStock(normalizeStockInput(pasted));
  };

  const handleImageFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFormError('');
    setPreparingImage(true);
    try {
      const imageUrl = await compressMedicineImage(file);
      setForm((current) => ({ ...current, image_url: imageUrl }));
      setImageFileName(file.name);
    } catch (error) {
      setFormError(error.message || 'Gagal memproses gambar.');
      event.target.value = '';
    } finally {
      setPreparingImage(false);
    }
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    if (preparingImage) return;
    const price = Number(form.price);
    const stock = normalizeStockInput(form.stock);
    if (!form.name.trim()) return setFormError('Nama obat wajib diisi.');
    if (form.price === '' || !Number.isFinite(price) || price < 0) return setFormError('Harga harus angka minimal 0.');
    const identity = normalizeMedicineIdentity(form.name);
    if (inventoryDraft.some((medicine) => normalizeMedicineIdentity(medicine.name) === identity)) {
      return setFormError('Obat dengan nama dan dosis yang sama sudah ada di daftar.');
    }
    const restricted = isRestrictedMedicine(form.name);
    if (restricted && !window.confirm(RESTRICTED_MEDICINE_WARNING)) return;
    setFormError('');
    const result = await onAddMedicine({ ...form, name: form.name.trim(), price, stock, image_url: form.image_url?.trim() || null, restrictedConfirmed: restricted });
    if (result?.success) {
      setForm({ name: '', desc: '', price: '', stock: 0, image_url: '' });
      setImageFileName('');
      setShowAddForm(false);
    } else {
      setFormError(result?.message || 'Gagal menambahkan obat.');
    }
  };

  const openEditForm = (medicine) => {
    setFormError('');
    setEditingMedicine(medicine);
    setEditForm({
      name: medicine.name || '',
      desc: medicine.desc || '',
      price: String(medicine.price ?? ''),
      stock: normalizeStockInput(medicine.stock),
      image_url: medicine.image_url || ''
    });
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const price = Number(editForm.price);
    const stock = normalizeStockInput(editForm.stock);
    if (!editForm.name.trim()) return setFormError('Nama obat wajib diisi.');
    if (editForm.price === '' || !Number.isFinite(price) || price < 0) return setFormError('Harga harus angka minimal 0.');
    const restricted = isRestrictedMedicine(editForm.name);
    if (restricted && !window.confirm(RESTRICTED_MEDICINE_WARNING)) return;
    setFormError('');
    const updatedMedicine = {
      ...editingMedicine,
      ...editForm,
      name: editForm.name.trim(),
      price,
      stock,
      image_url: editForm.image_url.trim() || null,
      restrictedConfirmed: restricted
    };
    const updatedInventory = inventoryDraft.map((item) => item.id === editingMedicine.id ? updatedMedicine : item);
    const saved = await onSaveInventory(updatedInventory);
    if (saved) {
      setEditingMedicine(null);
      setEditForm(null);
    }
  };

  const handleDeleteFromEdit = async () => {
    if (!editingMedicine) return;
    const deleted = await onDeleteMedicine(editingMedicine);
    if (deleted) {
      setEditingMedicine(null);
      setEditForm(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-navy tracking-wide">
          Daftar Obat & Pengaturan
        </h2>
        <div className="flex items-center gap-2">
          {canManageInventory && <button type="button" disabled={savingInventory} onClick={() => setShowAddForm(true)} className="inline-flex h-8 items-center justify-center px-4 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50">+ Tambah Obat</button>}
          <div className="relative inline-flex h-8 items-center overflow-visible rounded-lg border border-slate-300 bg-white shadow-sm">
            <button
              type="button"
              aria-label={`Ubah urutan menjadi ${sortDirection === 'asc' ? 'menurun' : 'menaik'}`}
              title={`Urutan ${sortDirection === 'asc' ? 'menaik' : 'menurun'}`}
              onClick={() => setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')}
              className="inline-flex h-full w-9 items-center justify-center rounded-l-lg text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/30"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                {sortDirection === 'asc' ? <><path d="M8 6h8" /><path d="M5 12h14" /><path d="M2 18h20" /></> : <><path d="M2 6h20" /><path d="M5 12h14" /><path d="M8 18h8" /></>}
              </svg>
            </button>
            <span className="h-5 border-l border-slate-300" aria-hidden="true" />
            <button
              type="button"
              aria-label="Pilih dasar pengurutan"
              aria-expanded={showSortOptions}
              aria-haspopup="true"
              title={`Urutkan berdasarkan ${sortBy === 'id' ? 'ID obat' : 'nama obat'}`}
              onClick={() => setShowSortOptions((visible) => !visible)}
              className="inline-flex h-full w-8 items-center justify-center rounded-r-lg text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary/30"
            >
              <ChevronDown size={16} aria-hidden="true" />
            </button>
            {showSortOptions && (
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                <p className="mb-2 text-xs font-semibold text-slate-500">Urutkan berdasarkan</p>
                <button type="button" aria-pressed={sortBy === 'id'} onClick={() => { setSortBy('id'); setShowSortOptions(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${sortBy === 'id' ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  ID Obat {sortBy === 'id' && <Check size={15} aria-hidden="true" />}
                </button>
                <button type="button" aria-pressed={sortBy === 'name'} onClick={() => { setSortBy('name'); setShowSortOptions(false); }} className={`mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${sortBy === 'name' ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                  Nama Obat {sortBy === 'name' && <Check size={15} aria-hidden="true" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddForm && canManageInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !savingInventory) {
            setShowAddForm(false);
            setFormError('');
          }
        }}>
          <form onSubmit={handleAddSubmit} role="dialog" aria-modal="true" aria-labelledby="add-medicine-title" className="my-auto grid w-full max-w-xl grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:grid-cols-2 sm:p-6">
            <div className="sm:col-span-2 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="add-medicine-title" className="text-base font-bold text-navy">Tambah Obat</h3>
              <button type="button" aria-label="Tutup form tambah obat" disabled={savingInventory} onClick={() => { setShowAddForm(false); setFormError(''); }} className="rounded-lg px-3 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 disabled:opacity-50">×</button>
            </div>
            <label className="text-xs font-bold text-slate-600">Nama Obat<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-slate-600">Deskripsi<input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-slate-600">Harga<input required type="number" min="0" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-slate-600">Stok<input type="number" min={0} step={1} value={normalizeStockInput(form.stock)} onKeyDown={(e) => handleStockKeyDown(e, form.stock, (stock) => setForm((prev) => ({ ...prev, stock })))} onPaste={(e) => handleStockPaste(e, (stock) => setForm((prev) => ({ ...prev, stock })))} onChange={(e) => setForm((prev) => ({ ...prev, stock: normalizeStockInput(e.target.value) }))} className={`mt-1 w-full border border-slate-300 p-2 text-sm font-normal ${normalizeStockInput(form.stock) === 0 ? 'text-slate-400' : 'text-slate-900'}`} /></label>
            <label className="text-xs font-bold text-slate-600 sm:col-span-2">
              Upload Gambar Obat (Opsional)
              <span className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-primary hover:text-primary">
                <ImagePlus size={18} aria-hidden="true" />
                {preparingImage ? 'Memproses gambar...' : imageFileName || 'Pilih gambar dari perangkat'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} disabled={preparingImage || savingInventory} className="sr-only" />
              </span>
              <span className="mt-1 block text-[11px] font-normal text-slate-500">JPEG, PNG, atau WebP. Maksimal 10 MB; gambar akan dikompres otomatis.</span>
            </label>
            {form.image_url && (
              <div className="sm:col-span-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <img src={form.image_url} alt="Pratinjau gambar obat" className="h-16 w-16 rounded border border-slate-200 bg-white object-contain" />
                <span className="min-w-0 break-all text-xs text-slate-600">{imageFileName || 'Pratinjau gambar'}</span>
                <button type="button" onClick={() => { setForm((current) => ({ ...current, image_url: '' })); setImageFileName(''); }} className="ml-auto shrink-0 text-xs font-bold text-red-700">Hapus</button>
              </div>
            )}
            <label className="text-xs font-bold text-slate-600 sm:col-span-2">Atau URL Gambar<input placeholder="Contoh: /images/medicines/paracetamol.svg atau https://..." value={form.image_url.startsWith('data:') ? '' : form.image_url} onChange={(e) => { setForm({ ...form, image_url: e.target.value }); setImageFileName(''); }} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
            {formError && <p className="sm:col-span-2 text-sm text-red-700">{formError}</p>}
            <div className="sm:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" disabled={savingInventory || preparingImage} onClick={() => { setShowAddForm(false); setFormError(''); }} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold uppercase disabled:opacity-50">Batal</button><button disabled={savingInventory || preparingImage} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase disabled:opacity-50">{preparingImage ? 'Memproses Gambar...' : savingInventory ? 'Menambahkan...' : 'Tambah Obat'}</button></div>
          </form>
        </div>
      )}

      {editingMedicine && editForm && canManageInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !savingInventory && deletingMedicineId !== editingMedicine.id) {
            setEditingMedicine(null);
            setEditForm(null);
            setFormError('');
          }
        }}>
          <form onSubmit={handleEditSubmit} role="dialog" aria-modal="true" aria-labelledby="edit-medicine-title" className="my-auto grid w-full max-w-xl grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:grid-cols-2 sm:p-6">
            <div className="sm:col-span-2 flex items-center justify-between border-b border-slate-100 pb-3">
              <div><h3 id="edit-medicine-title" className="text-base font-bold text-navy">Edit Obat</h3><p className="mt-1 text-xs text-slate-500">Perbarui data {editingMedicine.name}</p></div>
              <button type="button" aria-label="Tutup form edit obat" disabled={savingInventory || deletingMedicineId === editingMedicine.id} onClick={() => { setEditingMedicine(null); setEditForm(null); setFormError(''); }} className="rounded-lg px-3 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100 disabled:opacity-50">×</button>
            </div>
            <label className="text-xs font-bold text-slate-600">Nama Obat<input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-slate-600">Deskripsi<input value={editForm.desc} onChange={(e) => setEditForm({ ...editForm, desc: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-slate-600">Harga<input required type="number" min="0" step="1" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-slate-600">Stok<input type="number" min={0} step={1} value={normalizeStockInput(editForm.stock)} onKeyDown={(e) => handleStockKeyDown(e, editForm.stock, (stock) => setEditForm((prev) => ({ ...prev, stock })))} onPaste={(e) => handleStockPaste(e, (stock) => setEditForm((prev) => ({ ...prev, stock })))} onChange={(e) => setEditForm((prev) => ({ ...prev, stock: normalizeStockInput(e.target.value) }))} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
            <label className="text-xs font-bold text-slate-600 sm:col-span-2">URL Gambar (Opsional)<input placeholder="Contoh: /images/medicines/paracetamol.svg atau https://..." value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
            {formError && <p className="sm:col-span-2 text-sm text-red-700">{formError}</p>}
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <button type="button" disabled={savingInventory || deletingMedicineId === editingMedicine.id} onClick={handleDeleteFromEdit} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-xs font-bold uppercase text-red-700 hover:bg-red-50 disabled:opacity-50">
                {deletingMedicineId === editingMedicine.id ? <span className="loading-spinner" aria-hidden="true" /> : <Trash2 size={15} aria-hidden="true" />}
                Hapus
              </button>
              <div className="flex gap-2"><button type="button" disabled={savingInventory || deletingMedicineId === editingMedicine.id} onClick={() => { setEditingMedicine(null); setEditForm(null); setFormError(''); }} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold uppercase disabled:opacity-50">Batal</button><button type="submit" disabled={savingInventory || deletingMedicineId === editingMedicine.id} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase disabled:opacity-50">{savingInventory ? 'Menyimpan...' : 'Simpan Perubahan'}</button></div>
            </div>
          </form>
        </div>
      )}

      {loadingMedicines ? (
        <div className="py-12 text-center border border-slate-200 bg-white text-slate-500 text-sm">
          Memuat data inventaris...
        </div>
      ) : errorMedicines ? (
        <div className="py-8 px-6 text-center border border-red-200 bg-red-50 text-red-800 text-sm rounded space-y-3">
          <p className="font-bold">{errorMedicines}</p>
          {onRetryMedicines && (
            <button
              onClick={onRetryMedicines}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider transition"
            >
              Coba Lagi
            </button>
          )}
        </div>
      ) : inventoryDraft.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-200 text-slate-500 text-sm">
          Belum ada obat di inventaris.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-neutral uppercase tracking-wider">
                <th className="p-3 w-14 text-center">Gambar</th>
                <th className="p-3">ID Obat</th>
                <th className="p-3">Nama Obat</th>
                <th className="p-3">Deskripsi</th>
                <th className="p-3">Harga (IDR)</th>
                <th className="p-3">Jumlah Stok</th>
                <th className="p-3">URL Gambar</th>
                <th className="p-3 text-center">Status</th>
                {canManageInventory && <th className="p-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {sortedInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-10 h-10 object-contain rounded border border-slate-200 bg-slate-50 mx-auto" />
                    ) : (
                      <div className="w-10 h-10 rounded border border-slate-200 bg-slate-100 flex items-center justify-center text-[9px] text-slate-400 font-semibold mx-auto">No Img</div>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs text-slate-500">{item.id}</td>
                  <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="p-3 text-slate-600">{item.desc || '—'}</td>
                  <td className="p-3">
                    <span className="whitespace-nowrap font-semibold text-slate-900">{formatIDR(item.price)}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold tabular-nums text-slate-900">{normalizeStockInput(item.stock)}</span>
                  </td>
                  <td className="p-3 text-xs">
                    {item.image_url ? (
                      <a
                        href={item.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={item.image_url}
                        className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
                      >
                        Lihat gambar
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-bold border ${normalizeStockInput(item.stock) > 0
                          ? 'bg-success-soft text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                    >
                      {normalizeStockInput(item.stock) > 0 ? 'Tersedia' : 'Habis'}
                    </span>
                  </td>
                  {canManageInventory && <td className="p-3 text-center"><button type="button" disabled={savingInventory || Boolean(deletingMedicineId)} onClick={() => openEditForm(item)} aria-label={`Edit ${item.name}`} title="Edit obat" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 disabled:opacity-50"><Pencil size={16} aria-hidden="true" /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </section>
  );
}
