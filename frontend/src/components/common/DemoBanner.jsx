import React from 'react';

export default function DemoBanner({ currentView, setCurrentView, isLoggedIn, onOpenPharmacy, onCustomerLogin, theme, onThemeChange }) {
  return (
    <div className="bg-navy text-white px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-sans border-b border-slate-800">
      <div className="flex items-center space-x-2 py-1">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold tracking-wide">MEDISTOCK</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 py-1">
        <button
          onClick={onCustomerLogin || (() => setCurrentView('customer-login'))}
          className={`px-3 py-1 rounded border transition ${currentView === 'customer-login'
              ? 'bg-primary text-white border-primary font-bold'
              : 'border-slate-700 text-slate-300 hover:text-white'
            }`}
        >
          Login Pengguna
        </button>
        <button
          onClick={() => setCurrentView('customer')}
          className={`px-3 py-1 rounded border transition ${['customer', 'checkout', 'qris', 'customer-history'].includes(currentView)
              ? 'bg-primary text-white border-primary font-bold'
              : 'border-slate-700 text-slate-300 hover:text-white'
            }`}
        >
          medistock.id (Customer Flow)
        </button>
        <button
          onClick={onOpenPharmacy || (() => setCurrentView(isLoggedIn ? 'admin-dashboard' : 'admin-login'))}
          className={`px-3 py-1 rounded border transition ${currentView === 'admin-login' || currentView === 'admin-dashboard'
              ? 'bg-primary text-white border-primary font-bold'
              : 'border-slate-700 text-slate-300 hover:text-white'
            }`}
        >
          medistock.id/apotek (Pharmacy Flow)
        </button>
        <label className="sr-only" htmlFor="site-theme">Tema tampilan</label>
        <select
          id="site-theme"
          value={theme}
          onChange={(event) => onThemeChange(event.target.value)}
          className="min-h-8 border border-slate-700 bg-navy px-2 text-xs font-semibold text-white focus:border-primary focus:outline-none"
        >
          <option value="light">Tema terang</option>
          <option value="dark">Tema gelap</option>
          <option value="system">Ikuti perangkat</option>
        </select>
      </div>
    </div>
  );
}
