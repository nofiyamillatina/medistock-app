import React, { useState } from 'react';

export default function PharmacyLoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await onLoginSuccess(username, password);
      if (res && !res.success) {
        setErrorMessage(res.message || 'Login gagal. Silakan periksa kredensial Anda.');
      }
    } catch (err) {
      setErrorMessage('Terjadi kesalahan saat menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto w-full px-4 py-16 flex-1 flex flex-col justify-center">
      <div className="border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center mb-8 border-b border-slate-200 pb-6">
          <h1 className="text-xl font-bold text-slate-900">MEDISTOCK</h1>
          <p className="text-xs font-semibold text-slate-500 tracking-wider uppercase mt-1">
            Portal Apotek
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3 border border-red-200 bg-red-50 text-red-700 text-xs font-medium rounded">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Username / Email
            </label>
            <input
              type="text"
              required
              placeholder="Masukkan username atau email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 p-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tracking-wider uppercase transition mt-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Memproses...' : 'Masuk ke Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

