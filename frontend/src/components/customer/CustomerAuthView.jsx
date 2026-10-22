import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function CustomerAuthView({ onLogin, onRegister }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const passwordRequirements = [
    { label: 'Minimal 8 karakter', valid: password.length >= 8 },
    { label: 'Huruf besar (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Huruf kecil (a-z)', valid: /[a-z]/.test(password) },
    { label: 'Angka (0-9)', valid: /\d/.test(password) },
    { label: 'Tanda baca/simbol (contoh: _, !, #)', valid: /[^A-Za-z0-9\s]/.test(password) }
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (isRegistering && passwordRequirements.some((requirement) => !requirement.valid)) {
      setErrorMessage('Password harus memenuhi semua persyaratan yang tercantum.');
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await (isRegistering ? onRegister : onLogin)(email, password);
      if (result && !result.success) {
        setErrorMessage(result.message || 'Login gagal. Silakan periksa kredensial Anda.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setIsRegistering((current) => !current);
    setErrorMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-sm mx-auto w-full px-4 py-16 flex-1 flex flex-col justify-center">
      <div className="border border-slate-200 rounded-2xl bg-white p-8 shadow-sm">
        <div className="text-center mb-8 border-b border-slate-200 pb-6">
          <img src="/images/medistock-logo.png" alt="MEDISTOCK" className="mx-auto h-16 w-auto" />
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-1">
            Akun Pengguna
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Masuk atau daftar agar pesanan tersimpan dan riwayatnya bisa dilihat kembali.
          </p>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-5 p-3 border border-red-200 bg-red-50 text-red-700 text-xs font-medium rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="customer-email" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Email
            </label>
            <input
              id="customer-email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="customer-password" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="customer-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={isRegistering ? 8 : undefined}
                aria-describedby={isRegistering ? 'customer-password-requirements' : undefined}
                aria-invalid={isRegistering && password.length > 0 && passwordRequirements.some((requirement) => !requirement.valid)}
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                placeholder={isRegistering ? 'Buat password yang kuat' : 'Masukkan password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-slate-300 p-3 pr-12 text-sm text-slate-900 focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 hover:text-primary"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            {isRegistering && (
              <ul id="customer-password-requirements" className="mt-2 space-y-1 text-xs" aria-live="polite">
                {passwordRequirements.map(({ label, valid }) => (
                  <li key={label} className={valid ? 'text-emerald-700' : 'text-slate-500'}>
                    <span aria-hidden="true">{valid ? '✓' : '•'}</span> {label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isRegistering && (
            <div>
              <label htmlFor="customer-confirm-password" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  id="customer-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full border border-slate-300 p-3 pr-12 text-sm text-slate-900 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                  aria-pressed={showConfirmPassword}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 hover:text-primary"
                >
                  {showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs tracking-wider uppercase transition mt-2 disabled:opacity-50"
          >
            {isSubmitting
              ? <span className="inline-flex items-center gap-2"><span className="loading-spinner" aria-hidden="true" />Memproses...</span>
              : isRegistering ? 'Daftar Akun' : 'Masuk'}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          {isRegistering ? 'Sudah punya akun?' : 'Belum punya akun?'}{' '}
          <button type="button" onClick={switchMode} className="font-bold text-primary hover:text-primary-hover">
            {isRegistering ? 'Masuk' : 'Daftar'}
          </button>
        </p>
      </div>
    </div>
  );
}
