import React, { useMemo, useState } from 'react';
import { formatIDR } from '../../services/formatters.js';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function getTransactionDateParts(value) {
  const raw = String(value || '').trim();
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T, ]+(\d{1,2}):(\d{2}))?/);
  if (iso) return { year: +iso[1], month: +iso[2], day: +iso[3], hour: +(iso[4] || 0), minute: +(iso[5] || 0) };

  // Locale timestamps can use either a two or four digit year, e.g. "7/10/26, 10.34".
  const localized = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})(?:,?\s+(?:pukul\s+)?(\d{1,2})[.:](\d{2}))?/i);
  if (localized) {
    let year = +localized[3];
    if (year < 100) year += year < 50 ? 2000 : 1900;
    return { year, month: +localized[2], day: +localized[1], hour: +(localized[4] || 0), minute: +(localized[5] || 0) };
  }
  return null;
}

function formatTransactionDateTime(value) {
  const parts = getTransactionDateParts(value);
  if (!parts || parts.month < 1 || parts.month > 12) return value || '—';
  const date = `${String(parts.day).padStart(2, '0')} ${monthNames[parts.month - 1]} ${parts.year}`;
  const time = `${String(parts.hour).padStart(2, '0')}.${String(parts.minute).padStart(2, '0')}`;
  return `${date} • ${time}`;
}

export default function SalesReportTab({ orders }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [statusFilter, setStatusFilter] = useState('all');

  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.orderStatus === 'Selesai');
  }, [orders]);

  const totalSalesToday = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [completedOrders]);

  const statuses = useMemo(() => [...new Set(orders.map((order) => order.orderStatus).filter(Boolean))].sort(), [orders]);

  const visibleOrders = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('id');
    const filtered = orders.filter((order) => {
      const matchesQuery = !query || [order.id, order.customerName, order.orderStatus]
        .some((value) => String(value || '').toLocaleLowerCase('id').includes(query));
      const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'id') return String(a.id).localeCompare(String(b.id), 'id');
      if (sortBy === 'name') return String(a.customerName).localeCompare(String(b.customerName), 'id');
      if (sortBy === 'status') return String(a.orderStatus).localeCompare(String(b.orderStatus), 'id');
      const partsA = getTransactionDateParts(a.timestamp);
      const partsB = getTransactionDateParts(b.timestamp);
      const dateA = partsA ? new Date(partsA.year, partsA.month - 1, partsA.day, partsA.hour, partsA.minute).getTime() : 0;
      const dateB = partsB ? new Date(partsB.year, partsB.month - 1, partsB.day, partsB.hour, partsB.minute).getTime() : 0;
      return dateB - dateA;
    });
  }, [orders, searchQuery, sortBy, statusFilter]);

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-bold text-navy tracking-wide">
        Ringkasan Penjualan Hari Ini
      </h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-xl p-6 bg-white space-y-1 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Penjualan Hari Ini
          </span>
          <span className="text-3xl font-extrabold text-slate-900">{formatIDR(totalSalesToday)}</span>
        </div>

        <div className="border border-slate-200 rounded-xl p-6 bg-white space-y-1 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Pesanan Selesai
          </span>
          <span className="text-3xl font-extrabold text-slate-900">{completedOrders.length} Pesanan</span>
        </div>
      </div>

      {/* Transaction History Table */}
      <div>
        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-navy tracking-wide">Riwayat Transaksi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:max-w-3xl">
            <label className="sr-only" htmlFor="sales-search">Cari transaksi</label>
            <input
              id="sales-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari ID, nama, atau status..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <label className="sr-only" htmlFor="sales-sort">Urutkan transaksi</label>
            <select id="sales-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white">
              <option value="latest">Data terbaru</option>
              <option value="id">ID transaksi</option>
              <option value="name">Nama pemesan</option>
              <option value="status">Status</option>
            </select>
            <label className="sr-only" htmlFor="sales-status">Filter status</label>
            <select id="sales-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white">
              <option value="all">Semua status</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
        <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-neutral uppercase tracking-wider">
                <th className="p-3">Waktu / Tanggal</th>
                <th className="p-3">ID Pesanan</th>
                <th className="p-3">Pemesan</th>
                <th className="p-3">Total Harga</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {visibleOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-slate-500 whitespace-nowrap">{formatTransactionDateTime(order.timestamp)}</td>
                  <td className="p-3 font-bold text-slate-900">{order.id}</td>
                  <td className="p-3 text-slate-700">{order.customerName}</td>
                  <td className="p-3 font-bold text-slate-900">{formatIDR(order.totalAmount)}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 font-bold uppercase text-[10px] border ${
                        order.orderStatus === 'Selesai'
                          ? 'bg-success-soft text-emerald-700 border-emerald-200'
                          : order.orderStatus === 'Dibatalkan'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {visibleOrders.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-sm text-slate-500">
                    Tidak ada transaksi yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
