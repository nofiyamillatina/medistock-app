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

  return (
    <div className="max-w-md mx-auto w-full px-4 py-10 flex-1 flex flex-col justify-center">
      <div className="border border-slate-200 rounded-2xl bg-white p-6 sm:p-8 text-center shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h1 className="text-lg font-bold text-slate-900">Pembayaran QRIS</h1>
          <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded">
            <span>WAKTU PEMBAYARAN:</span>
            <span className="text-slate-900 font-bold">{formatTimer(timeLeft)}</span>
          </div>
        </div>

        {/* Total Amount */}
        <div className="mb-6">
          <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1">
            Total Pembayaran
          </span>
          <span className="text-3xl font-extrabold text-slate-900">
            {formatIDR(currentOrder ? currentOrder.totalAmount : cartTotal)}
          </span>
        </div>

        {/* QR Code Box */}
        <div className="my-6 mx-auto max-w-full inline-block border-2 border-slate-200 p-2 bg-white shadow-inner">
          <img
            src="/images/qris-merchant.jpeg"
            alt="QRIS statis merchant untuk pembayaran MEDISTOCK"
            className="block w-full max-w-[320px] h-auto object-contain"
          />
        </div>

        {/* Instruction */}
        <div className="bg-slate-50 border border-slate-200 p-4 text-left text-xs text-slate-700 font-medium space-y-1 mb-8">
          <p>1. Buka e-wallet/bank (GoPay, OVO, ShopeePay, BCA, dll)</p>
          <p>2. Scan & Bayar nominal di atas sesuai instruksi.</p>
        </div>

        {/* Action Button */}
        <button
          onClick={onConfirmPayment}
          className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs uppercase tracking-wider transition shadow-sm"
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
