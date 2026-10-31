import React, { useEffect, useState } from 'react';
import { Building2, LogOut, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiService } from '../../services/api.js';

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-7 flex items-center gap-3 border-b border-slate-100 pb-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white"><ShieldCheck size={24} /></span>
          <div><p className="text-xs font-bold uppercase tracking-widest text-primary">MEDISTOCK</p><h1 className="text-xl font-bold text-slate-900">Admin Platform</h1></div>
        </div>
        <p className="mb-6 text-sm text-slate-600">Masuk untuk mengelola apotek mitra dan akun stafnya.</p>
        {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div><label htmlFor="platform-admin-email" className="mb-1 block text-xs font-bold uppercase text-slate-700">Email admin</label><input id="platform-admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-primary" /></div>
          <div><label htmlFor="platform-admin-password" className="mb-1 block text-xs font-bold uppercase text-slate-700">Password</label><input id="platform-admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none focus:border-primary" /></div>
          <button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-60">{busy ? 'Memeriksa akun…' : 'Masuk'}</button>
        </form>
      </section>
    </main>
  );
}

function NewPharmacyForm({ token, onCreated, onUnauthorized }) {
  const [name, setName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSuccess('');
    const result = await apiService.createPharmacyWithStaff({ name, staffEmail, staffUsername, staffPassword }, token);
    if (result?.success) {
      setSuccess(`${result.data.pharmacy.name} berhasil dibuat. Akun staf: ${result.data.staff.email}. Simpan password yang diberikan kepada staf dengan aman.`);
      setName('');
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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Plus size={20} /></span><div><h2 className="font-bold text-slate-900">Daftarkan apotek</h2><p className="text-xs text-slate-500">Akun staf akan langsung ditautkan ke apotek ini.</p></div></div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {success && <p role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label htmlFor="new-pharmacy-name" className="mb-1 block text-xs font-bold uppercase text-slate-700">Nama apotek</label><input id="new-pharmacy-name" required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary" /></div>
        <div><label htmlFor="new-staff-email" className="mb-1 block text-xs font-bold uppercase text-slate-700">Email staf</label><input id="new-staff-email" type="email" autoComplete="off" required value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary" /></div>
        <div><label htmlFor="new-staff-username" className="mb-1 block text-xs font-bold uppercase text-slate-700">Username staf <span className="font-normal normal-case text-slate-400">(opsional)</span></label><input id="new-staff-username" autoComplete="off" minLength={3} maxLength={40} value={staffUsername} onChange={(event) => setStaffUsername(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary" /></div>
        <div className="sm:col-span-2"><label htmlFor="new-staff-password" className="mb-1 block text-xs font-bold uppercase text-slate-700">Password awal staf</label><input id="new-staff-password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} value={staffPassword} onChange={(event) => setStaffPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-primary" /><p className="mt-1 text-xs text-slate-500">Minimal 10 karakter: huruf besar, huruf kecil, angka, dan simbol.</p></div>
        <div className="sm:col-span-2"><button disabled={busy} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60">{busy ? 'Menyimpan…' : 'Buat apotek dan akun staf'}</button></div>
      </form>
    </section>
  );
}

function PlatformAdminDashboard({ token, onLogout }) {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white"><ShieldCheck size={22} /></span><div><p className="text-xs font-bold uppercase tracking-widest text-primary">MEDISTOCK</p><h1 className="text-xl font-extrabold text-slate-900">Admin Platform</h1></div></div>
          <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><LogOut size={16} /> Keluar</button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">Apotek terdaftar</h2><p className="mt-1 text-xs text-slate-500">{pharmacies.length} apotek</p></div><button onClick={loadPharmacies} disabled={loading} aria-label="Muat ulang daftar apotek" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button></div>
            {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {loading ? <p className="py-8 text-center text-sm text-slate-500">Memuat daftar apotek…</p> : pharmacies.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Belum ada apotek.</p> : <div className="space-y-3">{pharmacies.map((pharmacy) => <article key={pharmacy.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><Building2 size={18} className="mt-0.5 shrink-0 text-primary" /><div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{pharmacy.name}</h3><p className="mt-1 break-all font-mono text-[11px] text-slate-500">{pharmacy.id}</p></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${pharmacy.isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{pharmacy.isOpen ? 'Buka' : 'Tutup'}</span></div></article>)}</div>}
          </section>

          <NewPharmacyForm token={token} onCreated={loadPharmacies} onUnauthorized={onLogout} />
        </div>
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

  if (view === 'checking') return <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">Memeriksa sesi admin…</main>;
  if (view === 'error') return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center"><p role="alert" className="max-w-md text-sm text-red-700">{checkingError}</p><button onClick={logout} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700">Kembali ke login</button></main>;
  if (view === 'dashboard') return <PlatformAdminDashboard token={token} onLogout={logout} />;
  return <PlatformAdminLogin onLogin={login} />;
}
