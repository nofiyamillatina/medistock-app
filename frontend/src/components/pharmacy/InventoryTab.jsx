import React from 'react';

export default function InventoryTab({
  inventoryDraft = [],
  setInventoryDraft,
  onSaveInventory,
  loadingMedicines = false,
  errorMedicines = null,
  onRetryMedicines
}) {
  const handlePriceChange = (id, newPrice) => {
    setInventoryDraft((prev) =>
      prev.map((m) => (m.id === id ? { ...m, price: Number(newPrice) || 0 } : m))
    );
  };

  const handleStockChange = (id, newStock) => {
    const stockNum = Math.max(0, Number(newStock) || 0);
    setInventoryDraft((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              stock: stockNum,
              status: stockNum === 0 ? 'Habis' : m.status
            }
          : m
      )
    );
  };

  const handleToggleStatus = (id) => {
    setInventoryDraft((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: m.status === 'Tersedia' ? 'Habis' : 'Tersedia'
            }
          : m
      )
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
          Daftar Obat & Pengaturan
        </h2>
        <button
          onClick={onSaveInventory}
          disabled={loadingMedicines || !!errorMedicines}
          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition shadow disabled:opacity-50"
        >
          Simpan Perubahan
        </button>
      </div>

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
        <div className="border border-slate-200 overflow-x-auto bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-3">Nama Obat</th>
                <th className="p-3">Harga (IDR)</th>
                <th className="p-3">Jumlah Stok</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {inventoryDraft.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-900">{item.name}</td>
                  <td className="p-3">
                    <div className="flex items-center border border-slate-300 w-32 px-2 py-1 bg-white">
                      <span className="text-xs text-slate-400 mr-1 font-mono">Rp</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="w-full text-sm font-bold text-slate-900 focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={item.stock}
                      onChange={(e) => handleStockChange(item.id, e.target.value)}
                      className="border border-slate-300 w-24 p-1 text-sm font-bold text-slate-900 text-center focus:outline-none bg-white"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className={`px-3 py-1 text-xs font-bold border transition ${
                        item.status === 'Tersedia'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-100 text-slate-500 border-slate-300'
                      }`}
                    >
                      {item.status === 'Tersedia' ? 'Tersedia' : 'Habis'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inventoryDraft.length > 0 && !loadingMedicines && !errorMedicines && (
        <div className="sticky bottom-4 border border-slate-900 bg-slate-900 text-white p-4 shadow-xl flex items-center justify-between">
          <span className="text-xs text-slate-300 font-medium">
            Lakukan perubahan harga & stok secara langsung di tabel di atas.
          </span>
          <button
            onClick={onSaveInventory}
            className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs tracking-wider uppercase transition"
          >
            Simpan Perubahan
          </button>
        </div>
      )}
    </section>
  );
}

