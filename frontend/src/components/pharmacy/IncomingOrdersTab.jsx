import React from 'react';
import { formatIDR } from '../../services/formatters.js';

export default function IncomingOrdersTab({ orders, onUpdateOrderStatus }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
        Daftar Pesanan Terbaru
      </h2>

      {orders.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-200 text-slate-500 text-sm">
          Belum ada pesanan masuk saat ini.
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="border border-slate-200 p-5 bg-white space-y-4">
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
                <span className="text-xs font-bold px-2 py-0.5 bg-slate-900 text-white">
                  {order.paymentStatus}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 border ${
                    order.orderStatus === 'Menunggu Konfirmasi'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : order.orderStatus === 'Selesai'
                      ? 'bg-slate-100 text-slate-800 border-slate-300'
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
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition"
                >
                  Konfirmasi & Siapkan
                </button>
                <button
                  onClick={() => onUpdateOrderStatus(order.id, 'Dibatalkan')}
                  className="px-5 py-2.5 border border-slate-300 hover:border-slate-800 text-slate-700 hover:text-slate-900 font-bold text-xs uppercase tracking-wider transition"
                >
                  Tolak
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </section>
  );
}
