import React from 'react';

export default function InventoryTab({
  inventoryDraft = [],
  setInventoryDraft,
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
  const [form, setForm] = React.useState({ name: '', desc: '', price: '', stock: '' });
  const [formError, setFormError] = React.useState('');
  const handlePriceChange = (id, newPrice) => {
    setInventoryDraft((prev) =>
      prev.map((m) => (m.id === id ? { ...m, price: newPrice } : m))
    );
  };

  const handleStockChange = (id, newStock) => {
    setInventoryDraft((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              stock: newStock,
              status: Number(newStock) === 0 ? 'Habis' : 'Tersedia'
            }
          : m
      )
    );
  };

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim()) return setFormError('Nama obat wajib diisi.');
    if (form.price === '' || !Number.isFinite(price) || price < 0) return setFormError('Harga harus angka minimal 0.');
    if (form.stock === '' || !Number.isInteger(stock) || stock < 0) return setFormError('Stok harus bilangan bulat minimal 0.');
    setFormError('');
    const result = await onAddMedicine({ ...form, name: form.name.trim(), price, stock });
    if (result?.success) {
      setForm({ name: '', desc: '', price: '', stock: '' });
      setShowAddForm(false);
    } else {
      setFormError(result?.message || 'Gagal menambahkan obat.');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-navy tracking-wide">
          Daftar Obat & Pengaturan
        </h2>
        {canManageInventory && <button onClick={() => setShowAddForm((shown) => !shown)} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider shadow-sm">+ Tambah Obat</button>}
      </div>

      {showAddForm && canManageInventory && (
        <form onSubmit={handleAddSubmit} className="border border-slate-200 rounded-xl bg-white p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-sm">
          <label className="text-xs font-bold text-slate-600">Nama Obat<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
          <label className="text-xs font-bold text-slate-600">Deskripsi<input value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
          <label className="text-xs font-bold text-slate-600">Harga<input required type="number" min="0" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
          <label className="text-xs font-bold text-slate-600">Stok<input required type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1 w-full border border-slate-300 p-2 text-sm font-normal" /></label>
          {formError && <p className="sm:col-span-2 text-sm text-red-700">{formError}</p>}
          <div className="sm:col-span-2 flex justify-end gap-2"><button type="button" disabled={savingInventory} onClick={() => { setShowAddForm(false); setFormError(''); }} className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold uppercase disabled:opacity-50">Batal</button><button disabled={savingInventory} className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold uppercase disabled:opacity-50">{savingInventory ? 'Menambahkan...' : 'Tambah Obat'}</button></div>
        </form>
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
                <th className="p-3">Nama Obat</th>
                <th className="p-3">Deskripsi</th>
                <th className="p-3">Harga (IDR)</th>
                <th className="p-3">Jumlah Stok</th>
                <th className="p-3 text-center">Status</th>
                {canManageInventory && <th className="p-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {inventoryDraft.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3"><input disabled={!canManageInventory || savingInventory} value={item.name} onChange={(e) => setInventoryDraft((prev) => prev.map((m) => m.id === item.id ? { ...m, name: e.target.value } : m))} className="w-44 border border-slate-300 p-1 font-bold text-slate-900 disabled:bg-slate-100" /></td>
                  <td className="p-3"><input disabled={!canManageInventory || savingInventory} value={item.desc || ''} onChange={(e) => setInventoryDraft((prev) => prev.map((m) => m.id === item.id ? { ...m, desc: e.target.value } : m))} className="w-48 border border-slate-300 p-1 text-slate-700 disabled:bg-slate-100" /></td>
                  <td className="p-3">
                    <div className="flex items-center border border-slate-300 w-32 px-2 py-1 bg-white">
                      <span className="text-xs text-slate-400 mr-1 font-mono">Rp</span>
                      <input
                        type="number" min="0" step="1"
                        value={item.price}
                        disabled={!canManageInventory || savingInventory}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="w-full text-sm font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <input
                      type="number" min="0" step="1"
                      value={item.stock}
                      disabled={!canManageInventory || savingInventory}
                      onChange={(e) => handleStockChange(item.id, e.target.value)}
                      className="border border-slate-300 w-24 p-1 text-sm font-bold text-slate-900 text-center focus:outline-none bg-white"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-bold border ${
                        item.status === 'Tersedia'
                          ? 'bg-success-soft text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}
                    >
                      {item.status === 'Tersedia' ? 'Tersedia' : 'Habis'}
                    </span>
                  </td>
                  {canManageInventory && <td className="p-3 text-center"><button disabled={deletingMedicineId === item.id || savingInventory} onClick={() => onDeleteMedicine(item)} className="px-3 py-1 border border-red-300 text-red-700 text-xs font-bold disabled:opacity-50">{deletingMedicineId === item.id ? 'Menghapus...' : 'Hapus'}</button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inventoryDraft.length > 0 && !loadingMedicines && !errorMedicines && (
        <div className="sticky bottom-4 border border-slate-900 bg-slate-900 text-white p-4 shadow-xl flex items-center justify-between">
          <span className="text-xs text-slate-300 font-medium">
          Lakukan perubahan data obat secara langsung di tabel di atas.
          </span>
          <button
            onClick={onSaveInventory}
            disabled={!canManageInventory || savingInventory}
            className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs tracking-wider uppercase transition disabled:opacity-50"
          >
            {savingInventory ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      )}
    </section>
  );
}

