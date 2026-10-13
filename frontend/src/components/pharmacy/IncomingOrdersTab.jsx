import React, { useMemo, useState } from 'react';
import { formatIDR } from '../../services/formatters.js';

function timestampValue(value) {
  const raw = String(value || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T, ]+(\d{1,2}):(\d{2}))?/);
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3], +(iso[4] || 0), +(iso[5] || 0)).getTime();
  const localized = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:,?\s+(?:pukul\s+)?(\d{1,2})[.:](\d{2}))?/i);
  if (!localized) return 0;
  let year = +localized[3];
  if (year < 100) year += year < 50 ? 2000 : 1900;
  return new Date(year, +localized[2] - 1, +localized[1], +(localized[4] || 0), +(localized[5] || 0)).getTime();
}

function formatOrderTimestamp(value) {
  const timestamp = timestampValue(value);
  if (!timestamp) return 'Waktu pesanan tidak tersedia';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date(timestamp));
}

function OrderActions({ order, onUpdateOrderStatus, updatingOrderId }) {
  if (['Selesai', 'Dibatalkan'].includes(order.orderStatus)) return null;
  return <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
    {order.orderStatus === 'Menunggu Konfirmasi' && <>
      <button onClick={() => onUpdateOrderStatus(order.id, 'Diproses')} disabled={updatingOrderId === order.id} className="flex-1 py-2.5 bg-success hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-60">
        {updatingOrderId === order.id ? <span className="inline-flex items-center gap-2"><span className="loading-spinner" aria-hidden="true" />Memproses...</span> : 'Konfirmasi & Siapkan'}
      </button>
      <button onClick={() => onUpdateOrderStatus(order.id, 'Dibatalkan')} disabled={updatingOrderId === order.id} className="px-5 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs uppercase tracking-wider transition disabled:opacity-60">Tolak</button>
    </>}
    {order.orderStatus === 'Diproses' && <button onClick={() => onUpdateOrderStatus(order.id, order.deliveryType === 'Pengantaran' ? 'Dalam Pengantaran' : 'Siap Diambil')} disabled={updatingOrderId === order.id} className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-60">{order.deliveryType === 'Pengantaran' ? 'Mulai Pengantaran' : 'Pesanan Siap Diambil'}</button>}
    {order.deliveryType === 'Ambil Sendiri' && order.orderStatus === 'Siap Diambil' && <button onClick={() => onUpdateOrderStatus(order.id, 'Selesai')} disabled={updatingOrderId === order.id} className="flex-1 py-2.5 bg-success hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition disabled:opacity-60">Tandai Selesai</button>}
  </div>;
}

function OrderDetailsModal({ order, onClose, onUpdateOrderStatus, updatingOrderId }) {
  if (!order) return null;
  const statusClass = ['Menunggu Konfirmasi', 'Diproses', 'Dalam Pengantaran', 'Siap Diambil'].includes(order.orderStatus)
    ? 'bg-primary-soft text-primary border-sky-200'
    : order.orderStatus === 'Selesai' ? 'bg-success-soft text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200';

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detail Pesanan</p><h2 id="order-detail-title" className="mt-1 font-mono text-xl font-bold text-navy">{order.id}</h2></div>
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Tutup</button>
      </header>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Nama Pemesan</p><p className="mt-1 text-sm font-semibold text-slate-900">{order.customerName || '-'}</p></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Nomor Telepon</p><a href={`tel:${order.phone}`} className="mt-1 inline-block text-sm font-semibold text-primary">{order.phone || '-'}</a></div>
        <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Alamat Pengantaran</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{order.address && order.address !== '-' ? order.address : 'Ambil sendiri di apotek'}</p></div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">{order.deliveryType}</span>
        <span className="rounded bg-navy px-2.5 py-1 text-xs font-bold text-white">{order.paymentStatus}</span>
        <span className={`border px-2.5 py-1 text-xs font-bold ${statusClass}`}>{order.orderStatus}</span>
      </div>
      <p className="mt-3 text-xs text-slate-500">Dipesan: {formatOrderTimestamp(order.timestamp)}</p>

      <div className="mt-5 rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-navy">Rincian Obat</h3>
        <div className="space-y-2 text-sm">{order.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-3"><span className="text-slate-700">{item.name} x {item.qty}</span><span className="font-mono text-slate-900">{formatIDR(item.price * item.qty)}</span></div>)}</div>
        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm font-bold text-slate-900"><span>Total Transaksi</span><span>{formatIDR(order.totalAmount)}</span></div>
      </div>
      <div className="mt-5"><OrderActions order={order} onUpdateOrderStatus={onUpdateOrderStatus} updatingOrderId={updatingOrderId} /></div>
    </section>
  </div>;
}

export default function IncomingOrdersTab({
  orders = [],
  onUpdateOrderStatus,
  updatingOrderId = null,
  loadingOrders = false,
  errorOrders = null,
  onRetryOrders
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const deliveryTypes = useMemo(() => [...new Set(['Pengantaran', 'Ambil Sendiri', ...orders.map((order) => order.deliveryType)].filter(Boolean))], [orders]);
  const paymentStatuses = useMemo(() => [...new Set(['Menunggu Pembayaran', 'Pending', 'Lunas', 'Lunas (QRIS)', ...orders.map((order) => order.paymentStatus)].filter(Boolean))], [orders]);
  const orderStatuses = useMemo(() => [...new Set(['Menunggu Konfirmasi', 'Diproses', 'Dalam Pengantaran', 'Siap Diambil', 'Selesai', 'Dibatalkan', ...orders.map((order) => order.orderStatus)].filter(Boolean))], [orders]);

  const visibleOrders = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('id');
    const filtered = orders.filter((order) => {
      const searchable = [order.id, order.customerName, order.phone, order.deliveryType, order.paymentStatus, order.orderStatus];
      return (!query || searchable.some((value) => String(value || '').toLocaleLowerCase('id').includes(query)))
        && (deliveryFilter === 'all' || order.deliveryType === deliveryFilter)
        && (paymentFilter === 'all' || order.paymentStatus === paymentFilter)
        && (orderFilter === 'all' || order.orderStatus === orderFilter);
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'id') return String(a.id || '').localeCompare(String(b.id || ''), 'id');
      if (sortBy === 'name') return String(a.customerName || '').localeCompare(String(b.customerName || ''), 'id');
      return timestampValue(b.timestamp) - timestampValue(a.timestamp);
    });
  }, [orders, searchQuery, sortBy, deliveryFilter, paymentFilter, orderFilter]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId);

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold text-navy tracking-wide">
        Daftar Pesanan Terbaru
      </h2>

      {loadingOrders ? (
        <div className="py-12 text-center border border-slate-200 bg-white text-slate-500 text-sm">
          Memuat pesanan masuk...
        </div>
      ) : errorOrders ? (
        <div className="py-8 px-6 text-center border border-red-200 bg-red-50 text-red-800 text-sm rounded space-y-3">
          <p className="font-bold">{errorOrders}</p>
          {onRetryOrders && (
            <button
              onClick={onRetryOrders}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider transition"
            >
              Coba Lagi
            </button>
          )}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-200 text-slate-500 text-sm">
          Belum ada pesanan masuk saat ini.
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
          <label className="sr-only" htmlFor="incoming-search">Cari pesanan</label>
          <input id="incoming-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari ID atau nama pemesan..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          <label className="sr-only" htmlFor="incoming-sort">Urutkan pesanan</label>
          <select id="incoming-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white">
            <option value="latest">Data terbaru</option><option value="id">ID transaksi</option><option value="name">Nama pemesan</option>
          </select>
          <label className="sr-only" htmlFor="incoming-delivery">Filter jenis pesanan</label>
          <select id="incoming-delivery" value={deliveryFilter} onChange={(event) => setDeliveryFilter(event.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white">
            <option value="all">Semua jenis pesanan</option>{deliveryTypes.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <label className="sr-only" htmlFor="incoming-payment">Filter status pembayaran</label>
          <select id="incoming-payment" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white">
            <option value="all">Semua status pembayaran</option>{paymentStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <label className="sr-only" htmlFor="incoming-status">Filter status pesanan</label>
          <select id="incoming-status" value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white">
            <option value="all">Semua status pesanan</option>{orderStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>
        {visibleOrders.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 text-slate-500 text-sm">Tidak ada pesanan yang cocok dengan pencarian atau filter.</div>
        ) : visibleOrders.map((order) => (
          <article key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-sm font-bold text-slate-900">{order.id}</span>
                <span className="text-sm font-semibold text-slate-700">{order.customerName}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Dipesan: {formatOrderTimestamp(order.timestamp)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">{order.deliveryType}</span>
                <span className="rounded bg-navy px-2 py-0.5 text-[10px] font-bold text-white">{order.paymentStatus}</span>
                <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700">{order.orderStatus}</span>
              </div>
            </div>
            <button type="button" onClick={() => setSelectedOrderId(order.id)} className="shrink-0 rounded-lg border border-primary px-4 py-2.5 text-xs font-bold text-primary transition hover:bg-primary-soft">Detail Pesanan</button>
          </article>
        ))}
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrderId(null)} onUpdateOrderStatus={onUpdateOrderStatus} updatingOrderId={updatingOrderId} />
        </>
      )}
    </section>
  );
}

