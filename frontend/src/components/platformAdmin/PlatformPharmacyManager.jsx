import React, { useEffect, useState } from 'react';
import { KeyRound, Power, Save, Trash2, X } from 'lucide-react';
import { apiService } from '../../services/api.js';
import AppDialog from '../common/AppDialog.jsx';
import PharmacyImageField from './PharmacyImageField.jsx';

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
};

const isGoogleMapsUrl = (value) => {
  if (!isHttpUrl(value)) return false;
  const hostname = new URL(value).hostname.toLowerCase();
  return hostname === 'maps.app.goo.gl'
    || hostname === 'goo.gl'
    || /(^|\.)google\.(com|[a-z]{2}|co\.[a-z]{2})$/.test(hostname);
};

export default function PlatformPharmacyManager({ pharmacyId, token, onClose, onChanged, onLogout }) {
  const [detail, setDetail] = useState(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploadPending, setImageUploadPending] = useState(false);
  const [staffDrafts, setStaffDrafts] = useState({});
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formModal, setFormModal] = useState(null);
  const [modalFeedback, setModalFeedback] = useState(null);

  const load = async () => {
    setError('');
    const result = await apiService.getPlatformAdminPharmacy(pharmacyId, token);
    if (!result?.success) {
      if (result?.httpStatus === 401 || result?.httpStatus === 403) onLogout();
      setError(result?.message || 'Gagal memuat detail apotek.');
      return;
    }
    setDetail(result.data);
    setName(result.data.name);
    setAddress(result.data.address || '');
    setMapsUrl(result.data.maps_url || '');
    setImageUrl(result.data.image_url || '');
    setStaffDrafts(Object.fromEntries((result.data.staff || []).map((staff) => [staff.id, { email: staff.email, username: staff.username || '' }])));
  };

  useEffect(() => { load(); }, [pharmacyId]);

  const finishAction = async (result, successMessage) => {
    if (result?.httpStatus === 401 || result?.httpStatus === 403) onLogout();
    if (!result?.success) {
      setError(result?.message || 'Perubahan tidak berhasil.');
      return false;
    }
    setError('');
    setMessage(successMessage || result.message || 'Perubahan berhasil.');
    await Promise.all([load(), onChanged()]);
    return true;
  };

  const finishModalAction = async (result, successMessage) => {
    if (result?.httpStatus === 401 || result?.httpStatus === 403) onLogout();
    if (!result?.success) {
      setModalFeedback({ type: 'error', message: result?.message || 'Perubahan tidak berhasil.' });
      return false;
    }
    setError('');
    await Promise.all([load(), onChanged()]);
    setModalFeedback({ type: 'success', message: successMessage || result.message || 'Perubahan berhasil.' });
    return true;
  };

  const savePharmacy = async (event) => {
    event.preventDefault();
    if (name.trim().length < 2 || name.trim().length > 120) {
      setModalFeedback({ type: 'error', message: 'Nama apotek harus terdiri dari 2 sampai 120 karakter.' });
      return;
    }
    if (address.length > 500) {
      setModalFeedback({ type: 'error', message: 'Alamat apotek maksimal 500 karakter.' });
      return;
    }
    if (mapsUrl.trim() && !isGoogleMapsUrl(mapsUrl.trim())) {
      setModalFeedback({ type: 'error', message: 'URL Google Maps harus berupa URL HTTP/HTTPS dari domain Google Maps.' });
      return;
    }
    if (imageUrl.trim() && (imageUrl.trim().length > 2048 || !isHttpUrl(imageUrl.trim()))) {
      setModalFeedback({ type: 'error', message: 'URL foto toko harus berupa URL HTTP/HTTPS yang valid (maksimal 2048 karakter).' });
      return;
    }
    if (imageUploadPending) {
      setModalFeedback({ type: 'error', message: 'Unggah foto yang dipilih terlebih dahulu sebelum menyimpan.' });
      return;
    }
    setBusy(true);
    setModalFeedback(null);
    await finishModalAction(await apiService.updatePlatformAdminPharmacy(pharmacyId, {
      name,
      address,
      maps_url: mapsUrl,
      image_url: imageUrl
    }, token), 'Informasi apotek berhasil disimpan.');
    setBusy(false);
  };

  const saveStaff = async (staffId) => {
    setBusy(true);
    setModalFeedback(null);
    await finishModalAction(await apiService.updatePlatformAdminStaff(pharmacyId, staffId, staffDrafts[staffId], token), 'Akun staf berhasil diperbarui.');
    setBusy(false);
  };

  const resetPassword = async (staffId) => {
    setBusy(true);
    setModalFeedback(null);
    const result = await apiService.resetPlatformAdminStaffPassword(pharmacyId, staffId, passwordDrafts[staffId] || '', token);
    const succeeded = await finishModalAction(result, 'Password staf berhasil direset dan tidak ditampilkan kembali.');
    if (succeeded) setPasswordDrafts((drafts) => ({ ...drafts, [staffId]: '' }));
    setBusy(false);
  };

  const changeActive = async () => {
    if (!detail) return;
    const nextActive = !detail.isActive;
    if (!window.confirm(nextActive ? `Aktifkan kembali ${detail.name}?` : `Nonaktifkan ${detail.name}? Staf tidak dapat login dan pelanggan tidak dapat membuat pesanan baru.`)) return;
    setBusy(true);
    await finishAction(await apiService.setPlatformAdminPharmacyActive(pharmacyId, nextActive, token));
    setBusy(false);
  };

  const deletePharmacy = async () => {
    if (!detail || !window.confirm(`Hapus permanen ${detail.name}? Hanya apotek tanpa staf, obat, dan pesanan yang dapat dihapus.`)) return;
    setBusy(true);
    const result = await apiService.deletePlatformAdminPharmacy(pharmacyId, token);
    if (result?.httpStatus === 401 || result?.httpStatus === 403) onLogout();
    if (result?.success) {
      setMessage('Apotek kosong berhasil dihapus.');
      setDetail(null);
      await onChanged();
    } else setError(result?.message || 'Apotek tidak dapat dihapus.');
    setBusy(false);
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-6" onClick={() => !busy && onClose()}>
    <section role="dialog" aria-modal="true" aria-labelledby="pharmacy-detail-title" onClick={(event) => event.stopPropagation()} className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div><h2 id="pharmacy-detail-title" className="text-lg font-bold text-slate-900">Detail apotek</h2><p className="mt-1 break-all font-mono text-xs text-slate-500">ID tetap: {pharmacyId}</p></div>
        <button onClick={onClose} disabled={busy} aria-label="Tutup detail apotek" className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-50"><X size={16} /></button>
      </header>
      {error && !formModal && <div role="alert" className="mb-5 rounded border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}
      {!detail ? <div aria-busy="true" className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-500"><span className="loading-spinner text-primary" aria-hidden="true" />Memuat detail apotek...</div> : <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4"><div className="min-w-48 flex-1"><p className="text-xs font-bold uppercase text-slate-500">Profil apotek</p><p className="mt-1 font-semibold text-slate-900">{detail.name}</p>{detail.address && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{detail.address}</p>}{detail.maps_url && <a href={detail.maps_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-primary hover:underline">Buka Google Maps</a>}{detail.image_url && <p className="mt-1 truncate text-xs text-slate-500">Foto: {detail.image_url}</p>}</div><button type="button" disabled={busy} onClick={() => { setModalFeedback(null); setImageUploadPending(false); setFormModal({ type: 'pharmacy' }); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"><Save size={15} /> Edit informasi</button>
          <button type="button" disabled={busy} onClick={changeActive} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"><Power size={15} /> {detail.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
          <button type="button" disabled={busy} onClick={deletePharmacy} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 disabled:opacity-60"><Trash2 size={15} /> Hapus permanen</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status apotek</p><span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold ${detail.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${detail.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />{detail.isActive ? 'Aktif' : 'Nonaktif'}</span></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Operasional</p><span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold ${detail.isOpen ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${detail.isOpen ? 'bg-sky-500' : 'bg-slate-400'}`} />{detail.isOpen ? 'Buka' : 'Tutup'}</span></div><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Data apotek</p><p className="text-sm font-semibold text-slate-800">{detail.medicineCount} obat · {detail.orderCount} pesanan</p></div></div>
        <div><h3 className="mb-3 font-bold text-slate-900">Akun staf ({detail.staff.length})</h3>
          {detail.staff.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-500">Belum ada akun staf.</p> : <div className="space-y-4">{detail.staff.map((staff) => <article key={staff.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="break-all font-mono text-xs text-slate-500">Akun {staff.id}</p><p className="mt-2 text-sm text-slate-800">{staff.email}<span className="text-slate-500">{staff.username ? ` · ${staff.username}` : ' · Tanpa username'}</span></p>
            <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => { setModalFeedback(null); setFormModal({ type: 'staff', staffId: staff.id }); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60"><Save size={14} /> Edit akun</button><button type="button" disabled={busy} onClick={() => { setModalFeedback(null); setFormModal({ type: 'password', staffId: staff.id }); }} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800 disabled:opacity-60"><KeyRound size={14} /> Reset password</button></div>
          </article>)}</div>}
        </div>
        <p className="text-xs text-slate-500">Penghapusan permanen hanya berhasil bila tidak ada akun staf, obat, atau pesanan terkait. Riwayat transaksi tidak dihapus.</p>
      </div>}
      {formModal && detail && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5" onClick={() => !busy && setFormModal(null)}>
        <section role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
          <header className="mb-5 flex items-start justify-between gap-3"><h3 className="text-lg font-bold text-slate-900">{formModal.type === 'pharmacy' ? 'Edit apotek' : formModal.type === 'staff' ? 'Edit akun staf' : 'Reset password staf'}</h3><button type="button" disabled={busy} onClick={() => setFormModal(null)} aria-label="Tutup formulir" className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:opacity-50"><X size={16} /></button></header>
          {modalFeedback && <div role={modalFeedback.type === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-lg border p-3 text-sm font-medium ${modalFeedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{modalFeedback.message}</div>}
          {error && !modalFeedback && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
          {formModal.type === 'pharmacy' && <form noValidate onSubmit={savePharmacy} className="space-y-4">
            <label className="block text-xs font-bold uppercase text-slate-700">Nama apotek<input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full border border-slate-300 p-3 text-sm font-normal normal-case text-slate-900 focus:outline-none focus:border-primary" /></label>
            <label className="block text-xs font-bold uppercase text-slate-700">Alamat apotek <span className="font-normal normal-case text-slate-400">(opsional)</span><textarea maxLength={500} rows={3} value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1 w-full border border-slate-300 p-3 text-sm font-normal normal-case text-slate-900 focus:outline-none focus:border-primary" /></label>
            <label className="block text-xs font-bold uppercase text-slate-700">URL Google Maps <span className="font-normal normal-case text-slate-400">(opsional)</span><input type="url" maxLength={2048} value={mapsUrl} onChange={(event) => setMapsUrl(event.target.value)} placeholder="https://maps.app.goo.gl/..." className="mt-1 w-full border border-slate-300 p-3 text-sm font-normal normal-case text-slate-900 focus:outline-none focus:border-primary" /></label>
            <PharmacyImageField id={`edit-pharmacy-image-${pharmacyId}`} value={imageUrl} onChange={setImageUrl} token={token} onUnauthorized={onLogout} onPendingFileChange={setImageUploadPending} />
            <div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => { setName(detail.name); setAddress(detail.address || ''); setMapsUrl(detail.maps_url || ''); setImageUrl(detail.image_url || ''); setImageUploadPending(false); setModalFeedback(null); setFormModal(null); }} className="border border-slate-300 px-4 py-2.5 text-xs font-bold uppercase text-slate-700">Batal</button><button disabled={busy} className="bg-primary px-4 py-2.5 text-xs font-bold uppercase text-white hover:bg-primary-hover disabled:opacity-50">{busy ? <span className="inline-flex items-center gap-2"><span className="loading-spinner" aria-hidden="true" />Menyimpan...</span> : 'Simpan'}</button></div>
          </form>}
          {formModal.type === 'staff' && <form onSubmit={(event) => { event.preventDefault(); saveStaff(formModal.staffId); }} className="space-y-4"><label className="block text-xs font-bold uppercase text-slate-700">Email<input type="email" required value={staffDrafts[formModal.staffId]?.email || ''} onChange={(event) => setStaffDrafts((drafts) => ({ ...drafts, [formModal.staffId]: { ...drafts[formModal.staffId], email: event.target.value } }))} className="mt-1 w-full border border-slate-300 p-3 text-sm font-normal normal-case text-slate-900 focus:outline-none focus:border-primary" /></label><label className="block text-xs font-bold uppercase text-slate-700">Username<input value={staffDrafts[formModal.staffId]?.username || ''} onChange={(event) => setStaffDrafts((drafts) => ({ ...drafts, [formModal.staffId]: { ...drafts[formModal.staffId], username: event.target.value } }))} className="mt-1 w-full border border-slate-300 p-3 text-sm font-normal normal-case text-slate-900 focus:outline-none focus:border-primary" /></label><div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => { setStaffDrafts((drafts) => ({ ...drafts, [formModal.staffId]: { email: detail.staff.find((staff) => staff.id === formModal.staffId)?.email || '', username: detail.staff.find((staff) => staff.id === formModal.staffId)?.username || '' } })); setFormModal(null); }} className="border border-slate-300 px-4 py-2.5 text-xs font-bold uppercase text-slate-700">Batal</button><button disabled={busy} className="bg-primary px-4 py-2.5 text-xs font-bold uppercase text-white hover:bg-primary-hover disabled:opacity-50">{busy ? <span className="inline-flex items-center gap-2"><span className="loading-spinner" aria-hidden="true" />Menyimpan...</span> : 'Simpan'}</button></div></form>}
          {formModal.type === 'password' && <form onSubmit={(event) => { event.preventDefault(); resetPassword(formModal.staffId); }} className="space-y-4"><label className="block text-xs font-bold uppercase text-slate-700">Password baru<input type="password" autoComplete="new-password" required minLength={10} maxLength={128} value={passwordDrafts[formModal.staffId] || ''} onChange={(event) => setPasswordDrafts((drafts) => ({ ...drafts, [formModal.staffId]: event.target.value }))} className="mt-1 w-full border border-slate-300 p-3 text-sm font-normal normal-case text-slate-900 focus:outline-none focus:border-primary" /><span className="mt-1 block font-normal normal-case">Minimal 10 karakter: huruf besar, huruf kecil, angka, dan simbol.</span></label><div className="flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => { setPasswordDrafts((drafts) => ({ ...drafts, [formModal.staffId]: '' })); setFormModal(null); }} className="border border-slate-300 px-4 py-2.5 text-xs font-bold uppercase text-slate-700">Batal</button><button disabled={busy} className="bg-primary px-4 py-2.5 text-xs font-bold uppercase text-white hover:bg-primary-hover disabled:opacity-50">{busy ? <span className="inline-flex items-center gap-2"><span className="loading-spinner" aria-hidden="true" />Memproses...</span> : 'Reset password'}</button></div></form>}
        </section>
      </div>}
    </section>
    </div>
    <AppDialog dialog={message ? { type: 'success', title: 'Perubahan berhasil', message } : null} onClose={() => setMessage('')} />
    </>
  );
}
