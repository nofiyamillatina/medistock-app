import React, { useEffect } from 'react';
import { AlertCircle, Check, Info } from 'lucide-react';

export default function AppDialog({ dialog, onClose }) {
  useEffect(() => {
    if (!dialog) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && dialog.type !== 'confirm') onClose(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [dialog, onClose]);

  if (!dialog) return null;
  const isConfirm = dialog.type === 'confirm';
  const isSuccess = dialog.type === 'success';
  const isWarning = dialog.type === 'warning' || isConfirm;
  const isError = dialog.type === 'error';
  const Icon = isSuccess ? Check : isWarning || isError ? AlertCircle : Info;
  const title = dialog.title || (isSuccess ? 'Berhasil' : isConfirm ? 'Konfirmasi' : isError ? 'Terjadi kesalahan' : 'Perhatian');
  const iconStyle = isSuccess ? 'bg-emerald-100 text-emerald-700' : isWarning ? 'bg-amber-100 text-amber-800' : isError ? 'bg-red-100 text-red-700' : 'bg-primary-soft text-primary';

  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !isConfirm) onClose(false); }}>
    <section role={isConfirm ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-message" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl sm:p-8">
      <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${iconStyle}`}><Icon size={25} aria-hidden="true" /></div>
      <h2 id="app-dialog-title" className="text-xl font-bold text-slate-900">{title}</h2>
      <p id="app-dialog-message" className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{dialog.message}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        {isConfirm && <button type="button" onClick={() => onClose(false)} className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">{dialog.cancelLabel || 'Batal'}</button>}
        <button type="button" autoFocus onClick={() => onClose(isConfirm)} className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover">{isConfirm ? dialog.confirmLabel || 'Ya, lanjutkan' : 'OK'}</button>
      </div>
    </section>
  </div>;
}
