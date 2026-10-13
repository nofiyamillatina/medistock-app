import React from 'react';

export default function DemoBanner({ currentView, setCurrentView, isLoggedIn, onOpenPharmacy }) {
  return (
    <div className="bg-navy text-white px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-sans border-b border-slate-800">
      <div className="flex items-center space-x-2 py-1">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold tracking-wide">MEDISTOCK</span>
      </div>
      <div className="flex items-center space-x-2 py-1">
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
      </div>
    </div>
  );
}
