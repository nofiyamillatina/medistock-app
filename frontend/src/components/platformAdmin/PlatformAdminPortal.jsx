import React, { useEffect, useState } from 'react';
import { Building2, Eye, LogOut, Plus, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api.js';
import PlatformPharmacyManager from './PlatformPharmacyManager.jsx';
import AppDialog from '../common/AppDialog.jsx';
import PharmacyImageField from './PharmacyImageField.jsx';

const TOKEN_KEY = 'medistock_platform_admin_token';

function PlatformAdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const result = await onLogin(email, password);
    if (!result?.success) setError(result?.message || 'Login admin gagal.');
    setBusy(false);
  };

  return (
      <main className="mx-auto flex min-h-screen w-full max-w-sm flex-1 flex-col justify-center px-4 py-12 font-sans">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-7 border-b border-slate-200 pb-6 text-center">
          <img src="/images/medistock-logo.png" alt="MEDISTOCK" className="mx-auto h-16 w-auto" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Portal Admin Platform</p>
          <h1 className="mt-1 text-xl font-bold text-navy">Masuk Admin</h1>
        </div>
        <p className="mb-6 text-sm text-slate-600">Kelola apotek mitra dan akun staf MEDISTOCK.</p>
        {error && <div role="alert" className="mb-5 rounded border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}
        <form onSubmit={submit} className="space-y-5">
          <div><label htmlFor="platform-admin-email" className="mb-1 block text-xs font-bold uppercase text-slate-700">Email admin</label><input id="platform-admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@medistock.com" className="w-full border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:border-primary" /></div>
          <div><label htmlFor="platform-admin-password" className="mb-1 block text-xs font-bold uppercase text-slate-700">Password</label><input id="platform-admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan password" className="w-full border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:border-primary" /></div>
          <button disabled={busy} className="mt-2 w-full bg-primary py-3.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary-hover disabled:opacity-50">{busy ? <span className="inline-flex items-center justify-center gap-2"><span className="loading-spinner" aria-hidden="true" />Memproses...</span> : 'Masuk ke Admin Platform'}</button>
        </form>
      </section>
    </main>
  );
}

function NewPharmacyForm({ token, onCreated, onUnauthorized }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploadPending, setImageUploadPending] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (imageUploadPending) {
      setError('Unggah foto yang dipilih terlebih dahulu sebelum membuat apotek.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice(null);
    const result = await apiService.createPharmacyWithStaff({
      name,
      address,
      maps_url: mapsUrl,
      image_url: imageUrl,
      staffEmail,
      staffUsername,
      staffPassword
    }, token);
    if (result?.success) {
      setNotice({ type: 'success', title: 'Apotek berhasil didaftarkan', message: `${result.data.pharmacy.name} berhasil dibuat. Akun staf: ${result.data.staff.email}. Simpan password yang diberikan kepada staf dengan aman.` });
      setName('');
      setAddress('');
      setMapsUrl('');
      setImageUrl('');
      setImageUploadPending(false);
      setStaffEmail('');
      setStaffUsername('');
      setStaffPassword('');
      await onCreated();
    } else {
      if (result?.httpStatus === 401 || result?.httpStatus === 403) onUnauthorized();
      setError(result?.message || 'Apotek tidak berhasil dibuat.');
    }
    setBusy(false);
  };

  return <>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary"><Plus size={20} /></span><div><h2 className="font-bold text-navy">Daftarkan apotek</h2><p className="text-xs text-slate-500">Akun staf akan langsung ditautkan ke apotek ini.</p></div></div>
      {error && <div role="alert" className="mb-5 rounded border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{error}</div>}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label htmlFor="new-pharmacy-name" className="mb-1 block text-xs font-bold uppercase text-slate-700">Nama apotek</label><input id="new-pharmacy-name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary" /></div>
        <div className="sm:col-span-2"><label htmlFor="new-pharmacy-address" className="mb-1 block text-xs font-bold uppercase text-slate-700">Alamat apotek <span className="font-normal normal-case text-slate-400">(opsional)</span></label><textarea id="new-pharmacy-address" maxLength={500} rows={2} value={address} onChange={(event) => setAddress(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary" /></div>
        <div><label htmlFor="new-pharmacy-maps" className="mb-1 block text-xs font-bold uppercase text-slate-700">URL Google Maps <span className="font-normal normal-case text-slate-400">(opsional)</span></label><input id="new-pharmacy-maps" type="url" maxLength={2048} value={mapsUrl} onChange={(event) => setMapsUrl(event.target.value)} placeholder="https://maps.app.goo.gl/..." className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary" /></div>
        <div className="sm:col-span-2"><PharmacyImageField id="new-pharmacy-image" value={imageUrl} onChange={setImageUrl} token={token} onUnauthorized={onUnauthorized} onPendingFileChange={setImageUploadPending} /></div>
        <div><label htmlFor="new-staff-email" className="mb-1 block text-xs font-bold uppercase text-slate-700">Email staf</label><input id="new-staff-email" type="email" autoComplete="off" required value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary" /></div>
        <div><label htmlFor="new-staff-username" className="mb-1 block text-xs font-bold uppercase text-slate-700">Username staf <span className="font-normal normal-case text-slate-400">(opsional)</span></label><input id="new-staff-username" autoComplete="off" minLength={3} maxLength={40} value={staffUsername} onChange={(event) => setStaffUsername(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary" /></div>
        <div className="sm:col-span-2"><label htmlFor="new-staff-password" className="mb-1 block text-xs font-bold uppercase text-slate-700">Password awal staf</label><input id="new-staff-password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} value={staffPassword} onChange={(event) => setStaffPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary" /><p className="mt-1 text-xs text-slate-500">Minimal 10 karakter: huruf besar, huruf kecil, angka, dan simbol.</p></div>
        <div className="sm:col-span-2"><button disabled={busy} className="bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-primary-hover disabled:opacity-50">{busy ? <span className="inline-flex items-center gap-2"><span className="loading-spinner" aria-hidden="true" />Menyimpan...</span> : 'Buat apotek dan akun staf'}</button></div>
      </form>
    </section>
    <AppDialog dialog={notice} onClose={() => setNotice(null)} />
  </>;
}

function PlatformAdminDashboard({ token, onLogout }) {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('');

  const loadPharmacies = async () => {
    setLoading(true);
    const result = await apiService.getPlatformAdminPharmacies(token);
    if (result?.success) {
      setPharmacies(result.data || []);
      setError('');
    } else {
      if (result?.httpStatus === 401 || result?.httpStatus === 403) onLogout();
      setError(result?.message || 'Gagal mengambil daftar apotek.');
    }
    setLoading(false);
  };

  useEffect(() => { loadPharmacies(); }, [token]);

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-navy">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4"><img src="/images/medistock-logo.png" alt="MEDISTOCK" className="h-11 w-auto" /><div className="border-l border-slate-200 pl-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Portal Admin Platform</p><h1 className="text-2xl font-extrabold text-navy">Dashboard Admin</h1></div></div>
          <button onClick={onLogout} className="inline-flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-50"><LogOut size={16} /> Keluar</button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Apotek terdaftar</h2><p className="mt-1 text-xs text-slate-500">{pharmacies.length} apotek</p></div><button onClick={loadPharmacies} disabled={loading} aria-label="Muat ulang daftar apotek" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button></div>
            {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {loading ? <div aria-busy="true" className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-500"><span className="loading-spinner text-primary" aria-hidden="true" />Memuat daftar apotek...</div> : pharmacies.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500"><Building2 className="mx-auto mb-3 text-slate-400" size={28} /><p className="font-semibold text-slate-700">Belum ada apotek</p><p className="mt-1">Apotek yang didaftarkan akan muncul di sini.</p></div> : <div className="space-y-3">{pharmacies.map((pharmacy) => <article key={pharmacy.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><Building2 size={18} className="mt-0.5 shrink-0 text-primary" /><div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{pharmacy.name}</h3><p className="mt-1 break-all font-mono text-[11px] text-slate-500">{pharmacy.id}</p><p className="mt-2 text-xs text-slate-600">{pharmacy.staff?.length ? pharmacy.staff.map((staff) => `${staff.email}${staff.username ? ` · ${staff.username}` : ""}`).join(", ") : "Belum ada akun staf"}</p></div></div><div className="flex shrink-0 flex-col items-end gap-2"><span className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-semibold ${pharmacy.isActive ? 'border-emerald-200 bg-success-soft text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${pharmacy.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />{pharmacy.isActive ? 'Aktif' : 'Nonaktif'}</span><button onClick={() => setSelectedPharmacyId(pharmacy.id)} className="inline-flex items-center gap-1 border border-primary px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary transition hover:bg-primary-soft"><Eye size={14} /> Detail</button></div></div></article>)}</div>}
          </section>

          <NewPharmacyForm token={token} onCreated={loadPharmacies} onUnauthorized={onLogout} />
        </div>
        {selectedPharmacyId && <PlatformPharmacyManager pharmacyId={selectedPharmacyId} token={token} onClose={() => setSelectedPharmacyId('')} onChanged={loadPharmacies} onLogout={onLogout} />}
      </div>
    </main>
  );
}

export default function PlatformAdminPortal() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [view, setView] = useState(() => localStorage.getItem(TOKEN_KEY) ? 'checking' : 'login');
  const [checkingError, setCheckingError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiService.verifyPlatformAdminToken(token).then((result) => {
      if (!active) return;
      if (result?.success && result.user?.role === 'platform_admin') {
        setView('dashboard');
      } else if (result?.httpStatus === 401 || result?.httpStatus === 403) {
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
        setView('login');
      } else {
        setCheckingError(result?.message || 'Sesi admin belum dapat diverifikasi. Coba muat ulang halaman.');
        setView('error');
      }
    });
    return () => { active = false; };
  }, []);

  const login = async (email, password) => {
    const result = await apiService.loginPlatformAdmin(email, password);
    if (!result?.success || result.user?.role !== 'platform_admin') return result;
    localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setView('dashboard');
    return result;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setView('login');
  };

  if (view === 'checking') return <main role="status" aria-label="MEDISTOCK sedang memuat" className="fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center bg-white"><img src="/images/medistock-logo.png" alt="MEDISTOCK" className="h-auto w-56 sm:w-72" /><p className="mt-8 text-sm font-semibold tracking-wide text-slate-500">MEDISTOCK...</p><div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/5 animate-loading-progress rounded-full bg-primary" /></div></main>;
  if (view === 'error') return <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center"><section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><img src="/images/medistock-logo.png" alt="MEDISTOCK" className="mx-auto mb-5 h-14 w-auto" /><p role="alert" className="mb-5 rounded border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">{checkingError}</p><button onClick={logout} className="bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover">Kembali ke login</button></section></main>;
  if (view === 'dashboard') return <PlatformAdminDashboard token={token} onLogout={logout} />;
  return <PlatformAdminLogin onLogin={login} />;
}
