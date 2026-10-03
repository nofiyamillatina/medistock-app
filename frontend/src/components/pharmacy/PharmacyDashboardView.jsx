import React from 'react';
import IncomingOrdersTab from './IncomingOrdersTab.jsx';
import InventoryTab from './InventoryTab.jsx';
import SalesReportTab from './SalesReportTab.jsx';

export default function PharmacyDashboardView({
  isStoreOpen,
  setIsStoreOpen,
  adminTab,
  setAdminTab,
  orders = [],
  onUpdateOrderStatus,
  inventoryDraft = [],
  setInventoryDraft,
  onSaveInventory,
  onLogout,
  loadingOrders = false,
  errorOrders = null,
  onRetryOrders,
  loadingMedicines = false,
  errorMedicines = null,
  onRetryMedicines
}) {
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'Menunggu Konfirmasi').length;

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
      {/* Header 5. Dashboard Apotek */}
      <header className="border-b border-slate-200 pb-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Dashboard Apotek</h1>
              <span className="text-xs bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 font-mono">
                Apotek Sehat
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola pesanan masuk, stok obat & laporan harian
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Store Status Toggle */}
            <div className="flex items-center space-x-2 border border-slate-200 px-3 py-1.5 bg-white">
              <span className="text-xs font-bold text-slate-700">Status Toko:</span>
              <button
                onClick={() => setIsStoreOpen(!isStoreOpen)}
                className={`px-2 py-0.5 text-xs font-bold transition border ${
                  isStoreOpen
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {isStoreOpen ? 'BUKA' : 'TUTUP'}
              </button>
            </div>

            <button
              onClick={onLogout}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 underline"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mt-6 border-t border-slate-100 pt-4 overflow-x-auto">
          <button
            onClick={() => setAdminTab('orders')}
            className={`px-4 py-2 text-xs font-bold transition uppercase tracking-wider border-b-2 ${
              adminTab === 'orders'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Pesanan Masuk ({pendingOrdersCount})
          </button>
          <button
            onClick={() => setAdminTab('inventory')}
            className={`px-4 py-2 text-xs font-bold transition uppercase tracking-wider border-b-2 ${
              adminTab === 'inventory'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Kelola Stok & Harga
          </button>
          <button
            onClick={() => setAdminTab('reports')}
            className={`px-4 py-2 text-xs font-bold transition uppercase tracking-wider border-b-2 ${
              adminTab === 'reports'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Laporan Penjualan
          </button>
        </div>
      </header>

      {/* TAB 1: PESANAN MASUK */}
      {adminTab === 'orders' && (
        <IncomingOrdersTab
          orders={orders}
          onUpdateOrderStatus={onUpdateOrderStatus}
          loadingOrders={loadingOrders}
          errorOrders={errorOrders}
          onRetryOrders={onRetryOrders}
        />
      )}

      {/* TAB 2: KELOLA STOK & HARGA */}
      {adminTab === 'inventory' && (
        <InventoryTab
          inventoryDraft={inventoryDraft}
          setInventoryDraft={setInventoryDraft}
          onSaveInventory={onSaveInventory}
          loadingMedicines={loadingMedicines}
          errorMedicines={errorMedicines}
          onRetryMedicines={onRetryMedicines}
        />
      )}

      {/* TAB 3: LAPORAN PENJUALAN */}
      {adminTab === 'reports' && <SalesReportTab orders={orders} />}
    </div>
  );
}

