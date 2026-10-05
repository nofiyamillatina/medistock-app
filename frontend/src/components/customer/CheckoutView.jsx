import React from 'react';
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
  onBack
}) {
  const [phoneError, setPhoneError] = React.useState('');
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
          const phone = customerInfo.phone;

          if (!phone) {
            e.preventDefault();
            setPhoneError('Nomor telepon wajib diisi.');
            return;
          }

          if (!/^\d+$/.test(phone)) {
            e.preventDefault();
            setPhoneError('Nomor telepon hanya boleh berisi angka.');
            return;
          }

          if (!/^08\d{8,11}$/.test(phone)) {
            e.preventDefault();
            setPhoneError('Nomor telepon tidak valid.');
            return;
          }

          setPhoneError('');
          onPayViaQRIS(e);
        }}
        className="space-y-8"
      >
        {/* 1. Order Summary */}
        <section className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white shadow-sm">
          <h2 className="text-sm font-bold text-navy tracking-wide mb-4">
            Ringkasan Pesanan
          </h2>
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
              <div>
                <span className="block text-sm font-bold text-slate-900">Pengantaran</span>
                <span className="block text-xs text-slate-500">Diantar kurir apotek</span>
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
              <div>
                <span className="block text-sm font-bold text-slate-900">Ambil Sendiri</span>
                <span className="block text-xs text-slate-500">Ambil di Apotek Sehat</span>
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
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              placeholder="Masukkan nama Anda"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className="w-full border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nomor Telepon / WhatsApp *
            </label>

            <input
              type="tel"
              inputMode="numeric"
              required
              placeholder="Contoh: 081234567890"
              value={customerInfo.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');

                setCustomerInfo({
                  ...customerInfo,
                  phone: value
                });

                if (phoneError) {
                  setPhoneError('');
                }
              }}
              className={`w-full border p-3 text-sm text-slate-900 focus:outline-none ${phoneError
                ? 'border-red-500 focus:border-red-500'
                : 'border-slate-300 focus:border-primary'
                }`
              }
            />

            {phoneError && (
              <p className="mt-1 text-xs text-red-600">
                {phoneError}
              </p>
            )}
          </div>

          {deliveryMethod === 'Pengantaran' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Alamat Pengantaran *
              </label>
              <textarea
                required
                rows="2"
                placeholder="Tuliskan alamat lengkap beserta nomor rumah / patokan"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                className="w-full border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:border-primary"
              ></textarea>
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
          className="w-full py-4 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold text-sm tracking-wider uppercase transition shadow-sm"
        >
          Bayar via QRIS &rarr;
        </button>
      </form>
    </div>
  );
}
