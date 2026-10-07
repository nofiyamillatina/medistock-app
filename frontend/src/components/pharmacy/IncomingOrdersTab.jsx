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

export default function IncomingOrdersTab({
  orders = [],
  onUpdateOrderStatus,
  loadingOrders = false,
  errorOrders = null,
  onRetryOrders
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');

  const deliveryTypes = useMemo(() => [...new Set(['Pengantaran', 'Ambil Sendiri', ...orders.map((order) => order.deliveryType)].filter(Boolean))], [orders]);
  const paymentStatuses = useMemo(() => [...new Set(['Menunggu Pembayaran', 'Pending', 'Lunas', 'Lunas (QRIS)', ...orders.map((order) => order.paymentStatus)].filter(Boolean))], [orders]);
  const orderStatuses = useMemo(() => [...new Set(['Menunggu Konfirmasi', 'Selesai', 'Dibatalkan', ...orders.map((order) => order.orderStatus)].filter(Boolean))], [orders]);

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
          <div key={order.id} className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <span className="text-sm font-bold text-slate-900 mr-3">{order.id}</span>
                <span className="text-xs font-semibold text-slate-600 mr-2">
                  {order.customerName}
                </span>
                <span className="text-xs px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 font-mono">
                  {order.deliveryType}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-navy text-white">
                  {order.paymentStatus}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 border ${
                    order.orderStatus === 'Menunggu Konfirmasi'
                      ? 'bg-primary-soft text-primary border-sky-200'
                      : order.orderStatus === 'Selesai'
                      ? 'bg-success-soft text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {order.orderStatus}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1 text-xs text-slate-700">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    • {item.name} &times; {item.qty}
                  </span>
                  <span className="font-mono text-slate-900">{formatIDR(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Transaksi</span>
                <span>{formatIDR(order.totalAmount)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {order.orderStatus === 'Menunggu Konfirmasi' && (
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => onUpdateOrderStatus(order.id, 'Selesai')}
                  className="flex-1 py-2.5 bg-success hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider transition"
                >
                  Konfirmasi & Siapkan
                </button>
                <button
                  onClick={() => onUpdateOrderStatus(order.id, 'Dibatalkan')}
                  className="px-5 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs uppercase tracking-wider transition"
                >
                  Tolak
                </button>
              </div>
            )}
          </div>
        ))}
        </>
      )}
    </section>
  );
}

