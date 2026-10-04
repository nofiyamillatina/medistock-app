import React, { useMemo } from 'react';
import { formatIDR } from '../../services/formatters.js';

export default function CustomerHomeView({
  medicines = [],
  searchQuery,
  setSearchQuery,
  cart,
  addToCart,
  updateCartQty,
  cartTotal,
  isStoreOpen,
  onProceedToCheckout,
  loadingMedicines = false,
  errorMedicines = null,
  onRetryMedicines
}) {
  const filteredMedicines = useMemo(() => {
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.desc && m.desc.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [medicines, searchQuery]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
      {/* Header 1. Home & Search Screen */}
      <header className="border-b border-slate-200 pb-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">MEDISTOCK</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Apotek Mitra: <span className="text-slate-800 font-semibold">Apotek Sehat</span>
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded border ${
                isStoreOpen
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {isStoreOpen ? '● Apotek Buka' : '○ Apotek Tutup'}
            </span>
          </div>
        </div>
      </header>

      {!isStoreOpen && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-800 text-sm font-medium rounded">
          Apotek Sehat sedang tutup sementara. Anda masih bisa melihat katalog obat, namun pemesanan akan diproses saat toko buka.
        </div>
      )}

      {/* Search Input */}
      <div className="mb-8">
        <label htmlFor="medicine-search" className="sr-only">
          Cari nama obat
        </label>
        <div className="relative">
          <input
            id="medicine-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama obat..."
            className="w-full bg-white border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-slate-800 placeholder-slate-400 font-normal transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Medicine List */}
      <section className="flex-1 space-y-4 mb-12">
        <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">
          Katalog Obat ({loadingMedicines ? '...' : filteredMedicines.length})
        </h2>

        {loadingMedicines ? (
          <div className="py-12 text-center border border-slate-200 bg-white text-slate-500 text-sm space-y-2">
            <p className="font-semibold">Memuat katalog obat...</p>
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
        ) : filteredMedicines.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 text-slate-500 text-sm">
            {searchQuery
              ? `Tidak ada obat yang cocok dengan kata kunci "${searchQuery}".`
              : 'Belum ada obat yang tersedia di katalog.'}
          </div>
        ) : (
          filteredMedicines.map((med) => {
            const cartItem = cart.find((c) => c.id === med.id);
            const isOutOfStock = med.stock <= 0 || med.status === 'Habis';

            return (
              <div
                key={med.id}
                className="border border-slate-200 p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-slate-400"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-bold text-slate-900">{med.name}</h3>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border ${
                        isOutOfStock
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      {isOutOfStock ? 'Stok Habis' : 'Stok Tersedia'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{med.desc}</p>
                  <p className="text-sm font-bold text-slate-900 mt-2">{formatIDR(med.price)}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-2">Stok: {med.stock}</p>
                  <p className={`text-xs font-medium mt-0.5 ${isOutOfStock ? 'text-red-600' : 'text-slate-600'}`}>
                    {isOutOfStock ? 'Habis' : 'Tersedia'}
                  </p>
                </div>

                <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  {cartItem ? (
                    <div className="flex items-center space-x-2 border border-slate-300 p-1 bg-white">
                      <button
                        onClick={() => updateCartQty(med.id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">
                        {cartItem.qty}
                      </span>
                      <button
                        onClick={() => updateCartQty(med.id, 1)}
                        disabled={cartItem.qty >= med.stock}
                        className="w-7 h-7 flex items-center justify-center text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(med)}
                      disabled={isOutOfStock || !isStoreOpen}
                      className="px-5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white disabled:bg-slate-200 disabled:text-slate-400 transition"
                    >
                      + Tambah
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Sticky Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="sticky bottom-4 border border-slate-900 bg-slate-900 text-white p-4 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-300 font-medium">{cartCount} Item dalam keranjang</p>
            <p className="text-base font-bold text-white">
              {formatIDR(cartTotal)}{' '}
              <span className="text-xs font-normal text-slate-400">(Inc. Jasa Rp 3.000)</span>
            </p>
          </div>
          <button
            onClick={onProceedToCheckout}
            className="px-6 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs tracking-wider uppercase transition"
          >
            Lanjut Checkout &rarr;
          </button>
        </div>
      )}
    </div>
  );
}

