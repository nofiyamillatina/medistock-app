import React, { useEffect, useState } from 'react';
import { formatIDR } from '../../services/formatters.js';
import { OrderTrackingProgress } from './OrderTrackingProgress.jsx';

function readKnownOrders() {
  try {
    const references = JSON.parse(localStorage.getItem('medistock_customer_orders') || '[]');
    return Array.isArray(references) ? references.filter((order) => order?.id && order?.phone) : [];
  } catch { return []; }
}

function OrderRow({ order, selected, onSelect }) {
  const isFinished = ['Selesai', 'Dibatalkan'].includes(order.orderStatus);
  return <button type="button" onClick={() => onSelect(order.id)} className={`w-full rounded-xl border p-4 text-left transition hover:border-primary/50 ${selected ? 'border-primary bg-primary-soft/40' : 'border-slate-200 bg-white'}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="font-mono text-sm font-bold text-slate-900">{order.id}</p><p className="mt-1 text-xs text-slate-500">{order.deliveryType} - {order.timestamp}</p></div>
      <span className={`rounded-full px-3 py-1 text-xs font-bold ${isFinished ? order.orderStatus === 'Selesai' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700' : 'bg-primary-soft text-primary'}`}>{order.orderStatus}</span>
    </div>
    <p className="mt-3 text-xs text-slate-600">{order.items.map((item) => `${item.name} x ${item.qty}`).join(', ')}</p>
    <div className="mt-3 flex items-center justify-between"><span className="text-sm font-bold text-slate-900">{formatIDR(order.totalAmount)}</span><span className="text-xs font-semibold text-primary">{selected ? 'Detail terbuka' : 'Lihat progres'}</span></div>
  </button>;
}

export default function CustomerHistoryView({ onTrackOrder, onCompleteDelivery, onBack }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [loading, setLoading] = useState(true);
  const [completingDelivery, setCompletingDelivery] = useState(false);
  const [completionError, setCompletionError] = useState('');

  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      const references = readKnownOrders();
      const results = await Promise.all(references.map(({ id, phone }) => onTrackOrder(id, phone)));
      if (active) {
        setOrders(results.filter((result) => result?.success).map((result) => ({ ...result.data, phone: references.find((reference) => reference.id === result.data.id)?.phone || '' })));
        setLoading(false);
      }
    };
    loadOrders();
    const refreshInterval = window.setInterval(loadOrders, 15000);
    window.addEventListener('focus', loadOrders);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', loadOrders);
    };
  }, [onTrackOrder]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const activeOrders = orders.filter((order) => !['Selesai', 'Dibatalkan'].includes(order.orderStatus));
  const finishedOrders = orders.filter((order) => ['Selesai', 'Dibatalkan'].includes(order.orderStatus));
  const visibleOrders = activeTab === 'ongoing' ? activeOrders : finishedOrders;

  const handleCompleteDelivery = async () => {
    if (!selectedOrder || !window.confirm('Tandai pesanan ini selesai diterima?')) return;
    setCompletingDelivery(true);
    setCompletionError('');
    const result = await onCompleteDelivery(selectedOrder.id, selectedOrder.phone);
    if (result?.success) setOrders((current) => current.map((order) => order.id === selectedOrder.id ? { ...order, orderStatus: 'Selesai' } : order));
    else setCompletionError(result?.message || 'Pesanan belum dapat ditandai selesai.');
    setCompletingDelivery(false);
  };

  const renderOrderList = (items, emptyText) => items.length === 0
    ? <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">{emptyText}</p>
    : <div className="space-y-3">{items.map((order) => <OrderRow key={order.id} order={order} selected={selectedOrderId === order.id} onSelect={setSelectedOrderId} />)}</div>;

  return <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
    <button onClick={onBack} className="mb-5 text-sm font-semibold text-primary">Kembali</button>
    <header className="mb-6"><h1 className="text-2xl font-bold text-navy">Riwayat Pemesanan</h1><p className="mt-1 text-sm text-slate-500">Pilih pesanan untuk melihat progresnya. Status diperbarui otomatis.</p></header>

    {selectedOrder && <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"><div><p className="text-xs text-slate-500">ID Pesanan</p><p className="font-mono text-lg font-bold text-slate-900">{selectedOrder.id}</p></div><button type="button" onClick={() => setSelectedOrderId(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Tutup detail</button></div>
      <p className="mt-3 text-sm text-slate-600">{selectedOrder.deliveryType} - {selectedOrder.timestamp}</p>
      <OrderTrackingProgress order={selectedOrder} />
      {selectedOrder.deliveryType === 'Pengantaran' && selectedOrder.orderStatus === 'Dalam Pengantaran' && <div className="mt-5">
        <p className="mb-3 text-sm text-slate-600">Jika pesanan sudah Anda terima, tandai selesai untuk menutup proses pesanan.</p>
        <button type="button" onClick={handleCompleteDelivery} disabled={completingDelivery} className="w-full rounded-lg bg-success px-5 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-600 disabled:opacity-60">{completingDelivery ? 'Memproses...' : 'Tandai Selesai'}</button>
        {completionError && <p role="alert" className="mt-2 text-sm text-red-700">{completionError}</p>}
      </div>}
    </section>}

    <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1" role="tablist" aria-label="Kategori riwayat pemesanan">
      <button type="button" role="tab" aria-selected={activeTab === 'ongoing'} onClick={() => { setActiveTab('ongoing'); setSelectedOrderId(null); }} className={`rounded-lg px-3 py-3 text-xs font-bold transition sm:text-sm ${activeTab === 'ongoing' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Sedang Berjalan <span className="ml-1 text-[10px]">({activeOrders.length})</span></button>
      <button type="button" role="tab" aria-selected={activeTab === 'finished'} onClick={() => { setActiveTab('finished'); setSelectedOrderId(null); }} className={`rounded-lg px-3 py-3 text-xs font-bold transition sm:text-sm ${activeTab === 'finished' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Selesai <span className="ml-1 text-[10px]">({finishedOrders.length})</span></button>
    </div>
    {loading ? <p className="py-8 text-center text-sm text-slate-500">Memuat riwayat pesanan...</p>
      : orders.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">Belum ada pesanan di riwayat ini. Pesanan yang Anda buat akan muncul di sini.</p>
        : renderOrderList(visibleOrders, activeTab === 'ongoing' ? 'Tidak ada pesanan yang sedang berjalan.' : 'Belum ada pesanan yang selesai.')}
  </div>;
}
