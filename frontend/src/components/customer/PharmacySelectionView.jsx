import React from 'react';
import { ArrowRight, MapPin, Store } from 'lucide-react';

export default function PharmacySelectionView({
  pharmacies = [],
  selectedPharmacyId = '',
  loading = false,
  error = '',
  onRetry,
  onSelect,
  customerUser,
  onLogout
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <img src="/images/medistock-wordmark.png" alt="MEDISTOCK" className="aspect-[5.2/1] w-52 object-cover sm:w-60" />
          <p className="mt-2 text-sm text-slate-500">Pilih apotek untuk melihat katalog dan ketersediaan obat.</p>
        </div>
        {customerUser && <div className="flex items-center gap-3">
          <span className="max-w-48 truncate text-xs text-slate-500">{customerUser.email}</span>
          <button type="button" onClick={onLogout} className="text-xs font-bold text-primary hover:text-primary-hover">Keluar</button>
        </div>}
      </header>

      <main className="flex-1">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-wider text-primary">Marketplace MEDISTOCK</p><h1 className="mt-1 text-2xl font-extrabold text-navy sm:text-3xl">Pilih Apotek</h1></div>
          {!loading && !error && <span className="text-xs font-semibold text-slate-500">{pharmacies.length} apotek tersedia</span>}
        </div>

        {loading ? <div aria-busy="true" aria-label="Memuat daftar apotek" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="skeleton-shimmer mb-5 h-12 w-12 rounded-xl" />
            <div className="skeleton-shimmer mb-3 h-4 w-3/4 rounded" />
            <div className="skeleton-shimmer h-3 w-1/2 rounded" />
            <div className="skeleton-shimmer mt-6 h-10 w-full rounded-lg" />
          </div>)}
        </div> : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-800">
          <p className="font-bold">{error}</p>
          <button type="button" onClick={onRetry} className="mt-4 bg-red-700 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-800">Coba Lagi</button>
        </div> : pharmacies.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <Store className="mx-auto mb-3 text-slate-400" size={32} aria-hidden="true" />
          <h2 className="font-bold text-slate-800">Belum ada apotek aktif</h2>
          <p className="mt-1 text-sm text-slate-500">Silakan kembali lagi nanti untuk melihat apotek yang tersedia.</p>
        </div> : <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-5">
          {pharmacies.map((pharmacy) => {
            const isSelected = pharmacy.id === selectedPharmacyId;
            return <button key={pharmacy.id} type="button" onClick={() => onSelect(pharmacy.id)} className={`group flex min-h-52 flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary ${isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-slate-200'}`}>
              <div className="flex w-full items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary"><Store size={23} aria-hidden="true" /></span>
                {pharmacy.isOpen ? <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-success-soft px-2 py-1 text-[10px] font-bold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Buka</span> : <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" />Tutup sementara</span>}
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900 transition group-hover:text-primary">{pharmacy.name}</h2>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} aria-hidden="true" />Apotek tujuan pesanan</p>
              <span className="mt-auto inline-flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold uppercase tracking-wide text-primary">
                {isSelected ? 'Lanjutkan ke katalog' : 'Lihat katalog'}<ArrowRight size={16} aria-hidden="true" />
              </span>
            </button>;
          })}
        </div>}
      </main>
    </div>
  );
}
