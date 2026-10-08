import React from 'react';
import { AlertCircle, Store, Truck } from 'lucide-react';
import { formatIDR } from '../../services/formatters.js';

export default function CheckoutView({
  cart,
  updateCartQty,
  deliveryMethod,
  setDeliveryMethod,
  customerInfo,
  setCustomerInfo,
  cartSubtotal,
  serviceFee,
  cartTotal,
  onPayViaQRIS,
  onBack,
  submittingOrder = false
}) {
  const [fieldErrors, setFieldErrors] = React.useState({});
  const selectedItemCount = cart.length;
  const renderFieldError = (message) => message && (
    <p className="mt-1 flex items-center gap-1 text-xs text-red-600" role="alert">
      <AlertCircle size={14} aria-hidden="true" className="shrink-0" />
      <span>{message}</span>
    </p>
  );
  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <button
          onClick={onBack}
          className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1"
        >
          &larr; Kembali
        </button>
        <h1 className="text-lg font-bold text-slate-900">Checkout Pesanan</h1>
        <div className="w-12"></div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const errors = {};
          const phone = customerInfo.phone.trim();

          if (!customerInfo.name.trim()) {
            errors.name = 'Kolom Nama harus diisi. Masukkan nama yang sesuai.';
          }
          if (!phone) {
            errors.phone = 'Isikan nomor telepon / WhatsApp yang aktif atau terdaftar.';
          } else if (!/^\d+$/.test(phone)) {
            errors.phone = 'Nomor telepon hanya boleh berisi angka.';
          } else if (!/^08\d{8,11}$/.test(phone)) {
            errors.phone = 'Nomor telepon tidak valid.';
          }
          if (deliveryMethod === 'Pengantaran' && !customerInfo.address.trim()) {
            errors.address = 'Alamat pengantaran harus diisi.';
          }

          setFieldErrors(errors);
          if (Object.keys(errors).length > 0) return;
          onPayViaQRIS(e);
        }}
        className="space-y-8"
      >
        {/* 1. Order Summary */}
        <section className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-navy tracking-wide">
              Ringkasan Pesanan
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {selectedItemCount} Item Dipilih
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {cart.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatIDR(item.price)} &times; {item.qty}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, -1)}
                      className="px-2 py-0.5 text-xs font-bold hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, 1)}
                      className="px-2 py-0.5 text-xs font-bold hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold text-slate-900 min-w-[70px] text-right">
                    {formatIDR(item.price * item.qty)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Delivery Method */}
        <section className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white shadow-sm">
          <h2 className="text-sm font-bold text-navy tracking-wide mb-4">
            Metode Pengiriman
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`border p-4 cursor-pointer flex items-center space-x-3 transition ${deliveryMethod === 'Pengantaran' ? 'border-primary bg-primary-soft' : 'border-slate-200 hover:border-primary'
                }`}
            >
              <input
                type="radio"
                name="delivery"
                value="Pengantaran"
                checked={deliveryMethod === 'Pengantaran'}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="accent-primary"
              />
              <Truck size={20} aria-hidden="true" className="shrink-0 text-primary" />
              <div>
                <span className="block text-sm font-bold text-slate-900">Pengantaran</span>
                <span className="block text-xs text-slate-500">Diantar kurir resmi apotek ke alamat Anda</span>
              </div>
            </label>

            <label
              className={`border p-4 cursor-pointer flex items-center space-x-3 transition ${deliveryMethod === 'Ambil Sendiri' ? 'border-primary bg-primary-soft' : 'border-slate-200 hover:border-primary'
                }`}
            >
              <input
                type="radio"
                name="delivery"
                value="Ambil Sendiri"
                checked={deliveryMethod === 'Ambil Sendiri'}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="accent-primary"
              />
              <Store size={20} aria-hidden="true" className="shrink-0 text-primary" />
              <div>
                <span className="block text-sm font-bold text-slate-900">Ambil Sendiri di Apotek</span>
                <span className="block text-xs text-slate-500">Ambil langsung di kasir Apotek (Bebas Ongkir)</span>
              </div>
            </label>
          </div>
        </section>

        {/* 3. Customer Info Input */}
        <section className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-navy tracking-wide mb-2">
            Informasi Pemesan
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nama <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              placeholder="Masukkan nama Anda"
              value={customerInfo.name}
              onChange={(e) => {
                setCustomerInfo({ ...customerInfo, name: e.target.value });
                if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
              }}
              className={`w-full border p-3 text-sm text-slate-900 focus:outline-none ${fieldErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'}`}
            />
            {renderFieldError(fieldErrors.name)}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nomor Telepon / WhatsApp <span className="text-red-600">*</span>
            </label>

            <input
              type="tel"
              inputMode="numeric"
              placeholder="Contoh: 081234567890"
              value={customerInfo.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');

                setCustomerInfo({
                  ...customerInfo,
                  phone: value
                });

                if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
              }}
              className={`w-full border p-3 text-sm text-slate-900 focus:outline-none ${fieldErrors.phone
                ? 'border-red-500 focus:border-red-500'
                : 'border-slate-300 focus:border-primary'
                }`
              }
            />
            {renderFieldError(fieldErrors.phone)}
          </div>

          {deliveryMethod === 'Pengantaran' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Alamat Pengantaran <span className="text-red-600">*</span>
              </label>
              <textarea
                rows="2"
                placeholder="Tuliskan alamat lengkap beserta nomor rumah / patokan"
                value={customerInfo.address}
                onChange={(e) => {
                  setCustomerInfo({ ...customerInfo, address: e.target.value });
                  if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: '' });
                }}
                className={`w-full border p-3 text-sm text-slate-900 focus:outline-none ${fieldErrors.address ? 'border-red-500 focus:border-red-500' : 'border-slate-300 focus:border-primary'}`}
              ></textarea>
              {renderFieldError(fieldErrors.address)}
            </div>
          )}
        </section>

        {/* 4. Total Breakdown */}
        <section className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white space-y-2 text-sm shadow-sm">
          <h2 className="text-sm font-bold text-navy tracking-wide mb-3">
            Rincian Pembayaran
          </h2>
          <div className="flex justify-between text-slate-600">
            <span>Total Obat</span>
            <span className="font-medium text-slate-900">{formatIDR(cartSubtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Biaya Layanan</span>
            <span className="font-medium text-slate-900">{formatIDR(serviceFee)}</span>
          </div>
          <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between font-bold text-base text-slate-900">
            <span>Total Bayar</span>
            <span>{formatIDR(cartTotal)}</span>
          </div>
        </section>

        {/* 5. Action Button */}
        <button
          type="submit"
          disabled={submittingOrder}
          className="w-full py-4 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm tracking-wider uppercase transition shadow-sm"
        >
          <span className="inline-flex items-center justify-center gap-2">{submittingOrder && <span className="loading-spinner" aria-hidden="true" />}{submittingOrder ? 'Membuat Pesanan...' : 'Bayar via QRIS →'}</span>
        </button>
      </form>
    </div>
  );
}
