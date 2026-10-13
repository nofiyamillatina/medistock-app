import React from 'react';
import { BadgeCheck, Check, ClipboardList, PackageCheck, Store, Truck } from 'lucide-react';

export function OrderTrackingProgress({ order }) {
  if (order.orderStatus === 'Dibatalkan') return <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4"><h2 className="font-bold text-red-800">Pesanan dibatalkan</h2><p className="mt-1 text-sm text-red-700">Silakan hubungi apotek jika Anda memerlukan bantuan terkait pesanan ini.</p></div>;

  const steps = [
    { label: 'Menunggu konfirmasi', icon: ClipboardList },
    { label: 'Sedang disiapkan', icon: PackageCheck },
    { label: order.deliveryType === 'Pengantaran' ? 'Dalam pengantaran' : 'Siap diambil', icon: order.deliveryType === 'Pengantaran' ? Truck : Store },
    { label: 'Selesai', icon: BadgeCheck }
  ];
  const activeIndex = order.orderStatus === 'Menunggu Konfirmasi' ? 0
    : order.orderStatus === 'Diproses' ? 1
      : ['Dalam Pengantaran', 'Siap Diambil'].includes(order.orderStatus) ? 2
        : order.orderStatus === 'Selesai' ? 3 : 0;
  const details = [
    ['Menunggu konfirmasi dari apotek...', 'Apotek sedang memeriksa pesanan Anda. Status akan diperbarui setelah pesanan dikonfirmasi.'],
    ['Pesanan sedang disiapkan...', 'Apotek sedang menyiapkan obat dan memastikan pesanan Anda lengkap.'],
    order.deliveryType === 'Pengantaran'
      ? ['Pesanan sedang dalam pengantaran...', 'Kurir sedang mengantar pesanan ke alamat Anda. Mohon menunggu.']
      : ['Pesanan siap diambil...', 'Silakan datang ke apotek dan tunjukkan ID pesanan kepada petugas.'],
    ['Pesanan selesai. Terima kasih!', 'Pesanan Anda telah diterima. Semoga lekas sehat dan terima kasih telah berbelanja di MEDISTOCK.']
  ];
  const [currentTitle, currentDescription] = details[activeIndex];

  return <div className="mt-7">
    <div className="relative px-2">
      <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-slate-200" />
      <div aria-hidden="true" className="absolute left-[12.5%] top-5 h-1 rounded-full bg-primary transition-all duration-500" style={{ width: `${activeIndex * 25}%` }} />
      <ol className="relative grid grid-cols-4" aria-label="Progres pesanan">
        {steps.map(({ label, icon: Icon }, index) => {
          const isComplete = index < activeIndex;
          const isActive = index === activeIndex;
          return <li key={label} className="flex min-w-0 flex-col items-center text-center">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${isComplete || isActive ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white text-slate-400'} ${isActive ? 'ring-4 ring-primary/10' : ''}`}>
              {isComplete ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : <Icon size={18} aria-hidden="true" />}
            </span>
            <span className={`mt-2 max-w-20 text-[10px] font-semibold leading-tight sm:max-w-none sm:text-xs ${isComplete || isActive ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
          </li>;
        })}
      </ol>
    </div>
    <div className="mt-6 rounded-xl border border-primary/15 bg-primary-soft/50 p-4 sm:p-5" aria-live="polite">
      <p className="font-bold text-navy">{currentTitle}</p>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{currentDescription}</p>
    </div>
  </div>;
}

