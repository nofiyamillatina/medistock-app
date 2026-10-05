import React, { useState } from 'react';
import { Pill, Plus, Minus, ImageOff } from 'lucide-react';
import { formatIDR } from '../../services/formatters.js';
import { getDisplayStock } from '../../utils/stock.js';

export default function MedicineCard({
  med,
  cartItem,
  addToCart,
  updateCartQty,
  isStoreOpen
}) {
  const [imageError, setImageError] = useState(false);
  const stock = getDisplayStock(med.stock);
  const isOutOfStock = stock === 0;

  const hasImage = Boolean(med.image_url) && !imageError;

  return (
    <div className="group bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-sky-300 hover:shadow-md h-full">
      {/* Top Image Container */}
      <div className="relative w-full h-44 sm:h-48 bg-slate-100/80 flex items-center justify-center p-3 overflow-hidden border-b border-slate-100">
        {hasImage ? (
          <img
            src={med.image_url}
            alt={med.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
            <Pill size={36} className="text-slate-300 stroke-[1.5]" />
            <span className="text-[11px] font-medium text-slate-400">Tidak ada gambar</span>
          </div>
        )}

        {/* Stock Badge Overlay on Image */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className={`inline-flex items-center px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md border backdrop-blur-sm ${
              isOutOfStock
                ? 'bg-red-50/90 text-red-700 border-red-200'
                : 'bg-emerald-50/90 text-emerald-700 border-emerald-200'
            }`}
          >
            {isOutOfStock ? 'Stok Habis' : 'Stok Tersedia'}
          </span>
        </div>
      </div>

      {/* Card Body Information */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
            {med.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
            {med.desc || 'Obat terdaftar & berkualitas'}
          </p>

          <p className="text-base sm:text-lg font-extrabold text-navy mt-3">
            {formatIDR(med.price)}
          </p>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Stok: {stock}</span>
            <span className={`font-semibold flex items-center gap-1 ${isOutOfStock ? 'text-red-600' : 'text-emerald-700'}`}>
              <span className="text-[8px]">{isOutOfStock ? '●' : '●'}</span>
              {isOutOfStock ? 'Habis' : 'Tersedia'}
            </span>
          </div>
        </div>

        {/* Card Action Button */}
        <div className="pt-2">
          {cartItem ? (
            <div className="flex items-center justify-between border border-slate-200 rounded-lg p-1 bg-slate-50">
              <button
                type="button"
                onClick={() => updateCartQty(med.id, -1)}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-navy font-bold text-sm transition"
                aria-label={`Kurangi ${med.name}`}
              >
                <Minus size={14} />
              </button>
              <span className="font-bold text-xs text-slate-900 px-2">
                {cartItem.qty}
              </span>
              <button
                type="button"
                onClick={() => updateCartQty(med.id, 1)}
                disabled={cartItem.qty >= stock}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-navy font-bold text-sm transition disabled:opacity-30 disabled:hover:bg-white"
                aria-label={`Tambah ${med.name}`}
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(med)}
              disabled={isOutOfStock || !isStoreOpen}
              className="w-full py-2.5 px-3 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:border transition shadow-sm flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              Tambah ke Keranjang
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
