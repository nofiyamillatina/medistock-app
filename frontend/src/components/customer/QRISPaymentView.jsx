import React, { useEffect, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { formatIDR } from '../../services/formatters.js';

export default function QRISPaymentView({
  currentOrder,
  cartTotal,
  onCheckPaymentStatus,
  onConfirmPayment,
  onPaymentVerified,
  onBackToCheckout,
  showSuccessModal,
  onReset,
  onOpenHistory
}) {
  const [paymentStatus, setPaymentStatus] = useState(currentOrder?.paymentStatus || 'Menunggu Pembayaran');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    setPaymentStatus(currentOrder?.paymentStatus || 'Menunggu Pembayaran');
    setConfirmingPayment(false);
    setPaymentError('');
  }, [currentOrder?.id, currentOrder?.paymentStatus]);

  useEffect(() => {
    if (!currentOrder?.id || !onCheckPaymentStatus || showSuccessModal || paymentStatus === 'Lunas (QRIS)') return undefined;
    let active = true;
    const checkPayment = async () => {
      setCheckingPayment(true);
      const result = await onCheckPaymentStatus(currentOrder.id);
      if (!active) return;
      setCheckingPayment(false);
      if (result?.success && result.data?.paymentStatus) {
        setPaymentStatus(result.data.paymentStatus);
        setPaymentError('');
      } else if (result && !result.success) {
        setPaymentError(result.message || 'Status pembayaran belum dapat diperiksa.');
      }
    };
    checkPayment();
    const intervalId = window.setInterval(checkPayment, 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [currentOrder?.id, onCheckPaymentStatus, paymentStatus, showSuccessModal]);

  const handleConfirmPayment = async () => {
    if (!currentOrder?.id || confirmingPayment) return;
    setConfirmingPayment(true);
    setPaymentError('');
    try {
      const result = await onConfirmPayment(currentOrder.id);
      if (!result?.success) {
        setPaymentError(result?.message || 'Pembayaran belum dapat dikonfirmasi.');
        return;
      }
      onPaymentVerified?.();
    } finally {
      setConfirmingPayment(false);
    }
  };

  if (showSuccessModal) {
    return <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div role="status" aria-live="polite" className="w-full max-w-md border border-emerald-200 rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="w-14 h-14 bg-success text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold" aria-hidden="true">✓</div>
        <h1 className="mt-4 text-xl font-bold text-slate-900">Konfirmasi Pembayaran Diterima</h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">Apotek sudah memeriksa pembayaran Anda. Konfirmasi diterima dan pesanan menunggu diproses.</p>
        {currentOrder?.id && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">ID pesanan: <strong className="font-mono">{currentOrder.id}</strong></p>}
        <button onClick={onOpenHistory} className="w-full mt-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold tracking-wider uppercase">Lihat Riwayat & Progres</button>
        <button onClick={onReset} className="w-full mt-2 py-3 border border-slate-200 bg-white text-slate-700 text-xs font-bold tracking-wider uppercase">Kembali ke Beranda</button>
      </div>
    </div>;
  }

  return <div className="max-w-xl mx-auto w-full px-3 py-2 sm:px-4 sm:py-3 flex-1 flex flex-col justify-center">
    <button type="button" onClick={onBackToCheckout} className="mb-3 inline-flex min-h-10 items-center gap-2 self-start rounded-lg px-3 text-sm font-semibold text-primary transition hover:bg-primary-soft" aria-label="Kembali ke checkout">
      <ArrowLeft size={18} aria-hidden="true" />
      Kembali ke Checkout
    </button>
    <div className="border border-slate-200 rounded-2xl bg-white p-4 sm:p-5 text-center shadow-sm">
      <div className="border-b border-slate-200 pb-2 mb-3">
        <h1 className="text-base font-bold text-slate-900">Pembayaran QRIS</h1>
      </div>
      <div className="mb-3">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Total Tagihan</span>
        <span className="text-2xl font-extrabold text-slate-900">{formatIDR(currentOrder ? currentOrder.totalAmount : cartTotal)}</span>
      </div>
      <div className="mt-3 mx-auto flex max-w-full flex-col items-center justify-center border-2 border-slate-200 bg-white p-2 shadow-inner">
        <img src="/images/qris-merchant.jpeg" alt={`QRIS statis merchant untuk tagihan ${formatIDR(currentOrder?.totalAmount || cartTotal)}`} className="block max-h-[50vh] w-auto max-w-[min(82vw,400px)] object-contain" />
      </div>
      <a href="/images/qris-merchant.jpeg" download="qris-merchant-medistock.jpeg" className="mx-auto mt-3 mb-3 inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-xs font-bold text-primary hover:bg-primary-soft">
        <Download size={15} aria-hidden="true" />Unduh QRIS
      </a>
      <div className="mb-3 rounded-lg border border-primary/15 bg-primary-soft/50 px-3 py-2 text-left text-xs text-slate-700">
        <p className="font-bold text-navy">QRIS merchant statis</p>
        <p className="mt-1">Masukkan nominal tagihan di atas saat membayar. Setelah pembayaran diterima, apotek akan memeriksa dan memperbarui status pembayaran di sistem.</p>
      </div>
      {paymentStatus === 'Lunas (QRIS)'
        ? <p role="status" className="mb-2 rounded-lg bg-emerald-50 p-3 text-left text-xs font-semibold text-emerald-800">Pelanggan Telah Membayar Tagihan — pembayaran sudah diperiksa dan diterima oleh apotek.</p>
        : <p role="status" className="mb-2 rounded-lg bg-amber-50 p-3 text-left text-xs text-amber-800">{checkingPayment ? 'Memeriksa status pembayaran...' : 'Menunggu apotek memeriksa dan mengonfirmasi pembayaran QRIS.'}</p>}
      <button type="button" onClick={handleConfirmPayment} disabled={paymentStatus !== 'Lunas (QRIS)' || confirmingPayment || !currentOrder?.id} className="w-full rounded-lg bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
        {confirmingPayment ? 'Mengirim Konfirmasi...' : 'Saya Sudah Bayar'}
      </button>
      <p className="mt-2 text-left text-[11px] text-slate-500">Tombol aktif setelah apotek memeriksa pembayaran. QRIS statis tidak mengirim notifikasi otomatis ke website.</p>
      {paymentError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-left text-xs text-red-700">{paymentError}</p>}
    </div>
  </div>;
}
