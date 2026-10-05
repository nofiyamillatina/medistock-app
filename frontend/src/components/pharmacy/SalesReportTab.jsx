import React, { useMemo } from 'react';
import { formatIDR } from '../../services/formatters.js';

export default function SalesReportTab({ orders }) {
  const completedOrders = useMemo(() => {
    return orders.filter((o) => o.orderStatus === 'Selesai');
  }, [orders]);

  const totalSalesToday = useMemo(() => {
    return completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [completedOrders]);

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
        <h3 className="text-sm font-bold text-navy tracking-wide mb-3">
          Riwayat Transaksi
        </h3>
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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="p-3 text-slate-500 font-mono">{order.timestamp}</td>
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
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
