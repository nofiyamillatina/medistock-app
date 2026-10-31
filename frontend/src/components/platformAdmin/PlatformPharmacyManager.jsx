import React, { useEffect, useState } from 'react';
import { KeyRound, Power, Save, Trash2, X } from 'lucide-react';
import { apiService } from '../../services/api.js';

export default function PlatformPharmacyManager({ pharmacyId, token, onClose, onChanged, onLogout }) {
  const [detail, setDetail] = useState(null);
  const [name, setName] = useState('');
  const [staffDrafts, setStaffDrafts] = useState({});
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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

  const savePharmacy = async (event) => {
    event.preventDefault();
    setBusy(true);
    await finishAction(await apiService.updatePlatformAdminPharmacy(pharmacyId, { name }, token), 'Informasi apotek berhasil disimpan.');
    setBusy(false);
  };

  const saveStaff = async (staffId) => {
    setBusy(true);
    await finishAction(await apiService.updatePlatformAdminStaff(pharmacyId, staffId, staffDrafts[staffId], token), 'Akun staf berhasil diperbarui.');
    setBusy(false);
  };

  const resetPassword = async (staffId) => {
    setBusy(true);
    const result = await apiService.resetPlatformAdminStaffPassword(pharmacyId, staffId, passwordDrafts[staffId] || '', token);
    setPasswordDrafts((drafts) => ({ ...drafts, [staffId]: '' }));
    await finishAction(result, 'Password staf berhasil direset dan tidak ditampilkan kembali.');
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
      await onChanged();
      onClose();
    } else setError(result?.message || 'Apotek tidak dapat dihapus.');
    setBusy(false);
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-bold text-slate-900">Detail apotek</h2><p className="mt-1 break-all font-mono text-xs text-slate-500">ID tetap: {pharmacyId}</p></div>
        <button onClick={onClose} aria-label="Tutup detail apotek" className="rounded-lg border border-slate-200 p-2 text-slate-600"><X size={16} /></button>
      </header>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {!detail ? <p className="py-5 text-sm text-slate-500">Memuat detail apotek…</p> : <div className="space-y-6">
        <form onSubmit={savePharmacy} className="flex flex-wrap items-end gap-3">
          <label className="min-w-64 flex-1 text-xs font-bold uppercase text-slate-700">Nama apotek<input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal normal-case text-slate-900" /></label>
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Save size={15} /> Simpan</button>
          <button type="button" disabled={busy} onClick={changeActive} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"><Power size={15} /> {detail.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
          <button type="button" disabled={busy} onClick={deletePharmacy} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 disabled:opacity-60"><Trash2 size={15} /> Hapus permanen</button>
        </form>
        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3"><p>Status apotek: <strong>{detail.isActive ? 'Aktif' : 'Nonaktif'}</strong></p><p>Status operasional: <strong>{detail.isOpen ? 'Buka' : 'Tutup'}</strong></p><p>Data: <strong>{detail.medicineCount} obat · {detail.orderCount} pesanan</strong></p></div>
        <div><h3 className="mb-3 font-bold text-slate-900">Akun staf ({detail.staff.length})</h3>
          {detail.staff.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Belum ada akun staf.</p> : <div className="space-y-4">{detail.staff.map((staff) => <article key={staff.id} className="rounded-xl border border-slate-200 p-4">
            <p className="mb-3 break-all font-mono text-xs text-slate-500">Akun {staff.id}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-bold uppercase text-slate-600">Email<input type="email" required value={staffDrafts[staff.id]?.email || ''} onChange={(event) => setStaffDrafts((drafts) => ({ ...drafts, [staff.id]: { ...drafts[staff.id], email: event.target.value } }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal normal-case text-slate-900" /></label>
              <label className="text-xs font-bold uppercase text-slate-600">Username<input value={staffDrafts[staff.id]?.username || ''} onChange={(event) => setStaffDrafts((drafts) => ({ ...drafts, [staff.id]: { ...drafts[staff.id], username: event.target.value } }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal normal-case text-slate-900" /></label>
            </div>
            <button disabled={busy} onClick={() => saveStaff(staff.id)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60"><Save size={14} /> Simpan akun staf</button>
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
              <label className="min-w-64 flex-1 text-xs font-bold uppercase text-slate-600">Password baru<input type="password" autoComplete="new-password" minLength={10} maxLength={128} value={passwordDrafts[staff.id] || ''} onChange={(event) => setPasswordDrafts((drafts) => ({ ...drafts, [staff.id]: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal normal-case text-slate-900" /><span className="mt-1 block font-normal normal-case">Minimal 10 karakter: huruf besar/kecil, angka, dan simbol.</span></label>
              <button disabled={busy || !passwordDrafts[staff.id]} onClick={() => resetPassword(staff.id)} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2.5 text-xs font-bold text-amber-800 disabled:opacity-50"><KeyRound size={14} /> Reset password</button>
            </div>
          </article>)}</div>}
        </div>
        <p className="text-xs text-slate-500">Penghapusan permanen hanya berhasil bila tidak ada akun staf, obat, atau pesanan terkait. Riwayat transaksi tidak dihapus.</p>
      </div>}
    </section>
  );
}
