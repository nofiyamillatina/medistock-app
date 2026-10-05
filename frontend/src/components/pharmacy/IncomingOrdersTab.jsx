import React from 'react';
import { formatIDR } from '../../services/formatters.js';

export default function IncomingOrdersTab({
  orders = [],
  onUpdateOrderStatus,
  loadingOrders = false,
  errorOrders = null,
  onRetryOrders
}) {
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
        orders.map((order) => (
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
        ))
      )}
    </section>
  );
}

