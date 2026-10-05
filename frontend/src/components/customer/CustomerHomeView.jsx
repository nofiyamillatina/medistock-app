import React, { useMemo } from 'react';
import { Search } from 'lucide-react';
import MedicineCard from './MedicineCard.jsx';
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
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col">
      {/* Header 1. Home & Search Screen */}
      <header className="border-b border-slate-200 pb-6 mb-7">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-navy">MEDISTOCK</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Apotek Mitra: <span className="text-slate-800 font-semibold">Apotek Sehat</span>
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded border ${isStoreOpen
                  ? 'bg-success-soft text-emerald-700 border-emerald-200'
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
          <Search aria-hidden="true" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="medicine-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama obat..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-slate-900 text-sm focus:outline-none focus:border-primary placeholder-slate-400 font-normal transition shadow-sm"
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

      {/* Medicine Grid Catalog */}
      <section className="flex-1 mb-12">
        <h2 className="text-sm font-bold text-navy tracking-wide mb-4">
          Katalog Obat ({loadingMedicines ? '...' : filteredMedicines.length})
        </h2>

        {loadingMedicines ? (
          <div className="py-12 text-center border border-slate-200 rounded-xl bg-white text-slate-500 text-sm space-y-2">
            <p className="font-semibold">Memuat katalog obat...</p>
          </div>
        ) : errorMedicines ? (
          <div className="py-8 px-6 text-center border border-red-200 bg-red-50 text-red-800 text-sm rounded-xl space-y-3">
            <p className="font-bold">{errorMedicines}</p>
            {onRetryMedicines && (
              <button
                onClick={onRetryMedicines}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider transition rounded-lg"
              >
                Coba Lagi
              </button>
            )}
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl text-slate-500 text-sm bg-white">
            {searchQuery
              ? `Tidak ada obat yang cocok dengan kata kunci "${searchQuery}".`
              : 'Belum ada obat yang tersedia di katalog.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 items-stretch">
            {filteredMedicines.map((med) => {
              const cartItem = cart.find((c) => c.id === med.id);

              return (
                <MedicineCard
                  key={med.id}
                  med={med}
                  cartItem={cartItem}
                  addToCart={addToCart}
                  updateCartQty={updateCartQty}
                  isStoreOpen={isStoreOpen}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Sticky Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="sticky bottom-4 border border-navy bg-navy text-white p-4 sm:p-5 rounded-xl shadow-xl flex items-center justify-between gap-4">
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

