import React, { useState, useEffect } from 'react';
import { formatIDR, formatTimer } from '../../services/formatters.js';

export default function QRISPaymentView({
  currentOrder,
  cartTotal,
  onConfirmPayment,
  showSuccessModal,
  onReset
}) {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (showSuccessModal) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md border border-slate-200 rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-success text-white rounded-full flex items-center justify-center mx-auto text-2xl font-bold" aria-hidden="true">✓</div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Pembayaran Berhasil Dikonfirmasi</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">Pesanan Anda sedang disiapkan oleh Apotek Sehat.</p>
          <button onClick={onReset} className="w-full mt-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold tracking-wider uppercase">
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full px-3 py-2 sm:px-4 sm:py-3 flex-1 flex flex-col justify-center">
      <div className="border border-slate-200 rounded-2xl bg-white p-4 sm:p-5 text-center shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 pb-2 mb-3">
          <h1 className="text-base font-bold text-slate-900">Pembayaran QRIS</h1>
          <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded">
            <span>WAKTU PEMBAYARAN:</span>
            <span className="text-slate-900 font-bold">{formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Total Amount */}
        <div className="mb-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">
            Total Pembayaran
          </span>
          <span className="text-2xl font-extrabold text-slate-900">
            {formatIDR(currentOrder ? currentOrder.totalAmount : cartTotal)}
          </span>
        </div>

        {/* QR Code Box */}
        <div className="my-3 mx-auto max-w-full inline-block border-2 border-slate-200 p-2 bg-white shadow-inner">
          <img
            src="/images/qris-merchant.jpeg"
            alt="QRIS statis merchant untuk pembayaran MEDISTOCK"
            className="block w-auto max-w-[min(78vw,420px)] max-h-[44vh] object-contain"
          />
        </div>

        {/* Instruction */}
        <div className="bg-slate-50 border border-slate-200 p-2.5 text-left text-[10px] sm:text-xs text-slate-700 font-medium space-y-0.5 mb-3">
          <p>1. Buka e-wallet/bank (GoPay, OVO, ShopeePay, BCA, dll)</p>
          <p>2. Scan & Bayar nominal di atas sesuai instruksi.</p>
        </div>

        {/* Action Button */}
        <button
          onClick={onConfirmPayment}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
        >
          Saya Sudah Bayar
        </button>
      </div>

      {/* Payment Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-success text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h2 className="text-lg font-bold text-slate-900">Pembayaran Berhasil!</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pesanan sedang disiapkan oleh Apotek Sehat. Kurir akan segera memproses pengiriman ke alamat Anda.
            </p>
            <div className="border-t border-slate-200 pt-4">
              <button
                onClick={onReset}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold tracking-wider uppercase"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
