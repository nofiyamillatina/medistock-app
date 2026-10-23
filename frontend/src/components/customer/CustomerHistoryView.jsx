import React, { useCallback, useEffect, useState } from 'react';
import { formatIDR } from '../../services/formatters.js';
import { OrderTrackingProgress } from './OrderTrackingProgress.jsx';

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

function OrderReviewForm({ order, onSubmitReview, onReviewSaved }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submitReview = async (event) => {
    event.preventDefault();
    if (!rating || !comment.trim()) {
      setError('Pilih rating bintang dan tuliskan komentar.');
      return;
    }
    setSaving(true);
    setError('');
    const result = await onSubmitReview(order.id, rating, comment.trim());
    if (result?.success) onReviewSaved();
    else setError(result?.message || 'Ulasan gagal dikirim.');
    setSaving(false);
  };

  if (order.reviewRating) return <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
    <p className="font-bold text-amber-900">Ulasan Anda: {'★'.repeat(order.reviewRating)}{'☆'.repeat(5 - order.reviewRating)}</p>
    <p className="mt-1 text-sm text-slate-700">{order.reviewComment}</p>
  </div>;

  return <form onSubmit={submitReview} className="mt-5 rounded-xl border border-slate-200 p-4">
    <h3 className="font-bold text-slate-900">Bagaimana pengalaman Anda?</h3>
    <p className="mt-1 text-xs text-slate-500">Ulasan hanya dapat dikirim satu kali setelah pesanan diterima.</p>
    <div className="mt-3 flex gap-1" role="group" aria-label="Pilih rating bintang">
      {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} bintang`} aria-pressed={rating === value} className={`text-3xl leading-none ${value <= rating ? 'text-amber-400' : 'text-slate-300'}`}>★</button>)}
    </div>
    <label htmlFor="order-review-comment" className="mt-3 block text-xs font-semibold text-slate-700">Komentar</label>
    <textarea id="order-review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={3} required className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary" placeholder="Ceritakan pengalaman Anda..." />
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    <button type="submit" disabled={saving || !rating || !comment.trim()} className="mt-3 w-full rounded-lg bg-primary px-4 py-3 text-xs font-bold uppercase text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Mengirim ulasan...' : 'Kirim Ulasan'}</button>
  </form>;
}

export default function CustomerHistoryView({ onLoadOrders, onCompleteDelivery, onSubmitReview, onResumePayment, onBack, askConfirmation }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [loading, setLoading] = useState(true);
  const [completingDelivery, setCompletingDelivery] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const [loadError, setLoadError] = useState('');

  const loadOrders = useCallback(async () => {
    setLoadError('');
    const result = await onLoadOrders();
    if (result?.success) setOrders(result.data);
    else setLoadError(result?.message || 'Gagal memuat riwayat pemesanan.');
    setLoading(false);
  }, [onLoadOrders]);

  useEffect(() => {
    let active = true;
    const refreshOrders = async () => {
      setLoadError('');
      const result = await onLoadOrders();
      if (!active) return;
      if (result?.success) setOrders(result.data);
      else setLoadError(result?.message || 'Gagal memuat riwayat pemesanan.');
      setLoading(false);
    };
    refreshOrders();
    const refreshInterval = window.setInterval(refreshOrders, 15000);
    window.addEventListener('focus', refreshOrders);
    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshOrders);
    };
  }, [loadOrders, onLoadOrders]);

  const selectedOrder = orders.find((order) => order.id === selectedOrderId);
  const activeOrders = orders.filter((order) => !['Selesai', 'Dibatalkan'].includes(order.orderStatus));
  const finishedOrders = orders.filter((order) => ['Selesai', 'Dibatalkan'].includes(order.orderStatus));
  const visibleOrders = activeTab === 'ongoing' ? activeOrders : finishedOrders;

  const handleCompleteDelivery = async () => {
    if (!selectedOrder || !(await askConfirmation('Tandai pesanan ini selesai diterima?', 'Konfirmasi pesanan diterima'))) return;
    setCompletingDelivery(true);
    setCompletionError('');
    const result = await onCompleteDelivery(selectedOrder.id);
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

    {loading ? <div className="space-y-5" aria-busy="true" aria-label="Memuat riwayat pemesanan">
      <div className="skeleton-shimmer h-12 rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4"><div className="w-2/3 space-y-2"><div className="skeleton-shimmer h-4 w-32 rounded" /><div className="skeleton-shimmer h-3 w-48 max-w-full rounded" /></div><div className="skeleton-shimmer h-6 w-28 rounded-full" /></div>
          <div className="skeleton-shimmer mt-4 h-3 w-3/4 rounded" />
          <div className="mt-4 flex items-center justify-between"><div className="skeleton-shimmer h-4 w-24 rounded" /><div className="skeleton-shimmer h-8 w-28 rounded-lg" /></div>
        </div>)}
      </div>
    </div> : <>
      <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1" role="tablist" aria-label="Kategori riwayat pemesanan">
        <button type="button" role="tab" aria-selected={activeTab === 'ongoing'} onClick={() => { setActiveTab('ongoing'); setSelectedOrderId(null); }} className={`rounded-lg px-3 py-3 text-xs font-bold transition sm:text-sm ${activeTab === 'ongoing' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Sedang Berjalan <span className="ml-1 text-[10px]">({activeOrders.length})</span></button>
        <button type="button" role="tab" aria-selected={activeTab === 'finished'} onClick={() => { setActiveTab('finished'); setSelectedOrderId(null); }} className={`rounded-lg px-3 py-3 text-xs font-bold transition sm:text-sm ${activeTab === 'finished' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Selesai <span className="ml-1 text-[10px]">({finishedOrders.length})</span></button>
      </div>
      {loadError
        ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700"><p role="alert">{loadError}</p><button type="button" onClick={loadOrders} className="mt-3 font-bold text-red-800 underline">Coba lagi</button></div>
        : orders.length === 0
        ? <p className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">Belum ada pesanan di riwayat ini. Pesanan yang Anda buat akan muncul di sini.</p>
        : renderOrderList(visibleOrders, activeTab === 'ongoing' ? 'Tidak ada pesanan yang sedang berjalan.' : 'Belum ada pesanan yang selesai.')}
    </>}

    {selectedOrder && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedOrderId(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="customer-order-progress-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4"><div><p className="text-xs text-slate-500">ID Pesanan</p><h2 id="customer-order-progress-title" className="font-mono text-lg font-bold text-slate-900">{selectedOrder.id}</h2></div><button type="button" onClick={() => setSelectedOrderId(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Tutup</button></div>
        <p className="mt-3 text-sm text-slate-600">{selectedOrder.deliveryType} - {selectedOrder.timestamp}</p>
        <OrderTrackingProgress order={selectedOrder} />
        {selectedOrder.paymentStatus === 'Menunggu Pembayaran' && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">Pesanan ini belum dibayar. Lanjutkan ke QRIS dinamis untuk membayar tagihan otomatis.</p>
          <button type="button" onClick={() => onResumePayment(selectedOrder)} className="mt-3 w-full rounded-lg bg-primary px-4 py-3 text-xs font-bold uppercase text-white">Lanjutkan Pembayaran QRIS</button>
        </div>}
        {selectedOrder.deliveryType === 'Pengantaran' && selectedOrder.orderStatus === 'Dalam Pengantaran' && <div className="mt-5">
          <p className="mb-3 text-sm text-slate-600">Jika pesanan sudah Anda terima, tandai selesai untuk menutup proses pesanan.</p>
          <button type="button" onClick={handleCompleteDelivery} disabled={completingDelivery} className="w-full rounded-lg bg-success px-5 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-emerald-600 disabled:opacity-60">{completingDelivery ? 'Memproses...' : 'Tandai Selesai'}</button>
          {completionError && <p role="alert" className="mt-2 text-sm text-red-700">{completionError}</p>}
        </div>}
        {selectedOrder.orderStatus === 'Selesai' && <OrderReviewForm order={selectedOrder} onSubmitReview={onSubmitReview} onReviewSaved={loadOrders} />}
      </section>
    </div>}
  </div>;
}
