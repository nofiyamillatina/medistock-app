import React from 'react';

export default function DemoBanner({ currentView, setCurrentView, isLoggedIn }) {
  return (
    <div className="bg-slate-900 text-white px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono border-b border-slate-800">
      <div className="flex items-center space-x-2 py-1">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold tracking-wide">MEDISTOCK FULL-STACK APP</span>
      </div>
      <div className="flex items-center space-x-2 py-1">
        <button
          onClick={() => setCurrentView('customer')}
          className={`px-3 py-1 rounded border transition ${
            currentView === 'customer' || currentView === 'checkout' || currentView === 'qris'
              ? 'bg-white text-slate-900 border-white font-bold'
              : 'border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          medistock.id (Customer Flow)
        </button>
        <button
          onClick={() => {
            if (isLoggedIn) {
              setCurrentView('admin-dashboard');
            } else {
              setCurrentView('admin-login');
            }
          }}
          className={`px-3 py-1 rounded border transition ${
            currentView === 'admin-login' || currentView === 'admin-dashboard'
              ? 'bg-white text-slate-900 border-white font-bold'
              : 'border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          medistock.id/apotek (Pharmacy Flow)
        </button>
      </div>
    </div>
  );
}
