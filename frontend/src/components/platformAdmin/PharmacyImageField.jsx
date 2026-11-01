import React, { useEffect, useState } from 'react';
import { ImagePlus, Store, Upload, X } from 'lucide-react';
import { apiService } from '../../services/api.js';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function PharmacyImageField({ id, value, onChange, token, onUnauthorized, onPendingFileChange }) {
  const [file, setFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [previewFailed, setPreviewFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!file) {
      setLocalPreviewUrl('');
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => setPreviewFailed(false), [localPreviewUrl, value]);

  const selectFile = (event) => {
    const selected = event.target.files?.[0] || null;
    event.target.value = '';
    setError('');
    setNotice('');
    if (!selected) return;
    if (!ACCEPTED_IMAGE_TYPES.has(selected.type)) {
      setError('Pilih gambar JPG, PNG, atau WebP.');
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setError('Ukuran foto maksimal 4 MB.');
      return;
    }
    setFile(selected);
    onPendingFileChange?.(true);
    setPreviewFailed(false);
  };

  const uploadFile = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setNotice('');
    try {
      const result = await apiService.uploadPlatformPharmacyImage(file, token);
      if (result?.httpStatus === 401 || result?.httpStatus === 403) onUnauthorized?.();
      if (!result?.success || !result.data?.image_url) {
        setError(result?.message || 'Foto gagal diunggah.');
        return;
      }
      onChange(result.data.image_url);
      setFile(null);
      onPendingFileChange?.(false);
      setNotice('Foto berhasil diunggah. Simpan formulir untuk menerapkan perubahan.');
    } catch {
      setError('Foto gagal diunggah. Periksa koneksi lalu coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setFile(null);
    onPendingFileChange?.(false);
    setPreviewFailed(false);
    setError('');
    setNotice('');
    onChange('');
  };

  const previewUrl = localPreviewUrl || value;

  return <div className="space-y-3">
    <label htmlFor={`${id}-file`} className="block text-xs font-bold uppercase text-slate-700">Foto toko</label>
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:max-w-md">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-primary-soft text-primary" aria-hidden="true"><Store size={30} /><span className="text-xs font-semibold">Pratinjau foto toko</span></div>
      {previewUrl && !previewFailed && <img src={previewUrl} alt="Pratinjau foto toko" onError={() => setPreviewFailed(true)} className="absolute inset-0 h-full w-full object-cover" />}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={`${id}-file`} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">
        <ImagePlus size={15} aria-hidden="true" /> Pilih foto dari perangkat
      </label>
      <input id={`${id}-file`} type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} className="sr-only" />
      {file && <button type="button" onClick={uploadFile} disabled={uploading} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-hover disabled:opacity-50">
        {uploading ? <span className="loading-spinner" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
        {uploading ? 'Mengunggah...' : 'Unggah foto'}
      </button>}
      {file && <button type="button" onClick={() => { setFile(null); onPendingFileChange?.(false); setError(''); setNotice(''); }} disabled={uploading} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><X size={14} aria-hidden="true" /> Batalkan pilihan</button>}
      {value && !file && <button type="button" onClick={clearImage} disabled={uploading} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><X size={14} aria-hidden="true" /> Hapus foto</button>}
    </div>
    {file && <p className="text-xs text-slate-500">{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
    <label htmlFor={`${id}-url`} className="block text-xs font-semibold text-slate-600">Atau gunakan URL foto yang sudah tersedia</label>
    <input id={`${id}-url`} type="url" maxLength={2048} value={value || ''} onChange={(event) => { setFile(null); onPendingFileChange?.(false); setError(''); setNotice(''); onChange(event.target.value); }} placeholder="https://example.com/foto.jpg" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal normal-case text-slate-900 outline-none focus:border-primary" />
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700">{notice}</p>}
  </div>;
}
