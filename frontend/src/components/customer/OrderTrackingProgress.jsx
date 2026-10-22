import React from 'react';
import { BadgeCheck, Check, ClipboardList, CreditCard, PackageCheck, Store, Truck } from 'lucide-react';

function formatEstimatedArrival(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

export function OrderTrackingProgress({ order }) {
  if (order.orderStatus === 'Dibatalkan') return <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4"><h2 className="font-bold text-red-800">Pesanan dibatalkan</h2><p className="mt-1 text-sm text-red-700">Silakan hubungi apotek jika Anda memerlukan bantuan terkait pesanan ini.</p></div>;

  const paid = ['Lunas', 'Lunas (QRIS)', 'Selesai'].includes(order.paymentStatus);
  const isDelivery = order.deliveryType === 'Pengantaran';
  const steps = [
    { label: 'Pembayaran', icon: CreditCard },
    { label: 'Dikonfirmasi', icon: ClipboardList },
    { label: 'Disiapkan', icon: PackageCheck },
    { label: isDelivery ? 'Diserahkan ke kurir' : 'Siap diambil', icon: isDelivery ? Truck : Store },
    { label: 'Diterima', icon: BadgeCheck }
  ];
  const activeIndex = !paid ? 0 : order.orderStatus === 'Menunggu Konfirmasi' ? 1
    : order.orderStatus === 'Diproses' ? 2
      : ['Dalam Pengantaran', 'Siap Diambil'].includes(order.orderStatus) ? 3
        : order.orderStatus === 'Selesai' ? 4 : 0;
  let currentTitle = 'Menunggu pembayaran...';
  let currentDescription = 'Bayar menggunakan QRIS dan unggah bukti pembayaran. Pesanan akan diproses setelah apotek memverifikasi pembayaran.';

  if (paid) {
    const details = [
      '',
      ['Menunggu konfirmasi dari apotek...', 'Pembayaran berhasil diverifikasi. Apotek akan segera mengonfirmasi dan menyiapkan pesanan Anda.'],
      ['Pesanan sedang disiapkan...', 'Apotek sedang menyiapkan obat dan memastikan pesanan Anda lengkap.'],
      isDelivery
        ? ['Pesanan sedang dalam perjalanan...', 'Pesanan telah diserahkan kepada kurir dan sedang diantar ke alamat Anda.']
        : ['Pesanan siap diambil...', 'Silakan datang ke apotek dan tunjukkan ID pesanan kepada petugas.'],
      ['Pesanan selesai. Terima kasih!', 'Pesanan Anda telah diterima. Berikan ulasan untuk membantu apotek meningkatkan layanannya.']
    ];
    [currentTitle, currentDescription] = details[activeIndex];
  }
  const estimatedArrival = order.estimatedArrival && formatEstimatedArrival(order.estimatedArrival);

  return <div className="mt-7">
    <div className="relative px-2">
      <div aria-hidden="true" className="absolute left-[10%] right-[10%] top-5 h-1 rounded-full bg-slate-200" />
      <div aria-hidden="true" className="absolute left-[10%] top-5 h-1 rounded-full bg-primary transition-all duration-500" style={{ width: `${activeIndex * 20}%` }} />
      <ol className="relative grid grid-cols-5" aria-label="Progres pembayaran dan pesanan">
        {steps.map(({ label, icon: Icon }, index) => {
          const isComplete = paid && index < activeIndex;
          const isActive = index === activeIndex;
          return <li key={label} className="flex min-w-0 flex-col items-center text-center">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${isComplete || isActive && (paid || index === 0) ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-slate-400'} ${isActive ? 'ring-4 ring-primary/10' : ''}`}>
              {isComplete ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
            </span>
            <span className={`mt-2 max-w-20 text-[9px] font-semibold leading-tight sm:max-w-none sm:text-xs ${isComplete || isActive ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
          </li>;
        })}
      </ol>
    </div>
    <div className="mt-6 rounded-xl border border-primary/15 bg-primary-soft/50 p-4 sm:p-5" aria-live="polite">
      <p className="font-bold text-navy">{currentTitle}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{currentDescription}</p>
      {estimatedArrival && <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-sm font-semibold text-primary">Estimasi tiba: {estimatedArrival}</p>}
    </div>
  </div>;
}
