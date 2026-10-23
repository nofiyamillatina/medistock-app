import React from 'react';
import { BarChart3, ClipboardList, Package } from 'lucide-react';
import IncomingOrdersTab from './IncomingOrdersTab.jsx';
import InventoryTab from './InventoryTab.jsx';
import SalesReportTab from './SalesReportTab.jsx';

function PharmacyTabIcon({ type, active }) {
  if (!active) {
    const OutlineIcon = { orders: ClipboardList, inventory: Package, reports: BarChart3 }[type];
    return <OutlineIcon size={15} aria-hidden="true" />;
  }

  if (type === 'orders') {
    return <svg viewBox="0 0 20 20" className="h-[15px] w-[15px]" aria-hidden="true">
      <path fill="currentColor" d="M7 2h6a2 2 0 0 1 2 2h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1a2 2 0 0 1 2-2Zm0 2v1h6V4H7Z" />
      <path d="M6 9h1m2 0h5M6 12h1m2 0h5M6 15h1m2 0h5" fill="none" stroke="#0284C7" strokeWidth="1.4" strokeLinecap="round" />
    </svg>;
  }
  if (type === 'inventory') {
    return <svg viewBox="0 0 20 20" className="h-[15px] w-[15px]" aria-hidden="true">
      <path fill="currentColor" d="m10 1.5 8 4v9l-8 4-8-4v-9l8-4Z" />
      <path d="m2.5 5.8 7.5 3.8 7.5-3.8M10 9.6v8" fill="none" stroke="#0284C7" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>;
  }
  return <svg viewBox="0 0 20 20" className="h-[15px] w-[15px]" aria-hidden="true">
    <path fill="currentColor" d="M3 10h3v7H3zm5-5h3v12H8zm5-3h3v15h-3z" />
    <path d="M2 18h16" fill="none" stroke="#0284C7" strokeWidth="1.4" strokeLinecap="round" />
  </svg>;
}

export default function PharmacyDashboardView({
  isStoreOpen,
  setIsStoreOpen,
  adminTab,
  setAdminTab,
  orders = [],
  onUpdateOrderStatus,
  onVerifyCustomerPayment,
  inventoryDraft = [],
  onSaveInventory,
  onLogout,
  loadingOrders = false,
  errorOrders = null,
  onRetryOrders,
  loadingMedicines = false,
  errorMedicines = null,
  onRetryMedicines,
  onAddMedicine,
  onDeleteMedicine,
  askConfirmation,
  canManageInventory = false,
  savingInventory = false,
  deletingMedicineId = null,
  updatingOrderId = null
}) {
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'Menunggu Konfirmasi').length;

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col">
      {/* Header 5. Dashboard Apotek */}
      <header className="border-b border-slate-200 pb-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-navy">Dashboard Apotek</h1>
              <span className="text-xs bg-primary-soft text-primary border border-sky-200 px-2.5 py-1 rounded-full font-semibold">
                Apotek Sehat
              </span>
            </div>
            <p className="text-sm text-neutral mt-1">
              Kelola pesanan masuk, stok obat & laporan harian
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Store Status Toggle */}
            <div className="flex items-center space-x-2 border border-slate-200 rounded-lg px-3 py-2 bg-white shadow-sm">
              <span className="text-xs font-bold text-slate-700">Status Toko:</span>
              <button
                onClick={() => setIsStoreOpen(!isStoreOpen)}
                className={`px-2 py-0.5 text-xs font-bold transition border ${
                  isStoreOpen
                    ? 'bg-success text-white border-success'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {isStoreOpen ? 'BUKA' : 'TUTUP'}
              </button>
            </div>

            <button
              onClick={onLogout}
              className="text-xs font-bold text-neutral hover:text-navy underline"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div role="tablist" aria-label="Menu pharmacy flow" className="mt-6 flex gap-2 overflow-x-auto border-t border-slate-100 pt-4">
          <button
            type="button"
            role="tab"
            aria-selected={adminTab === 'orders'}
            onClick={() => setAdminTab('orders')}
            className={`shrink-0 rounded-lg border px-4 py-2.5 text-xs font-bold transition uppercase tracking-wider ${
              adminTab === 'orders'
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <PharmacyTabIcon type="orders" active={adminTab === 'orders'} />
              Pesanan Masuk
              {pendingOrdersCount > 0 && (
                <span
                  aria-label={`${pendingOrdersCount} pesanan menunggu konfirmasi`}
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] leading-none font-extrabold text-white"
                >
                  {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                </span>
              )}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={adminTab === 'inventory'}
            onClick={() => setAdminTab('inventory')}
            className={`shrink-0 rounded-lg border px-4 py-2.5 text-xs font-bold transition uppercase tracking-wider ${
              adminTab === 'inventory'
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2"><PharmacyTabIcon type="inventory" active={adminTab === 'inventory'} />Kelola Stok & Harga</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={adminTab === 'reports'}
            onClick={() => setAdminTab('reports')}
            className={`shrink-0 rounded-lg border px-4 py-2.5 text-xs font-bold transition uppercase tracking-wider ${
              adminTab === 'reports'
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-transparent bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <span className="inline-flex items-center gap-2"><PharmacyTabIcon type="reports" active={adminTab === 'reports'} />Laporan Penjualan</span>
          </button>
        </div>
      </header>

      {/* TAB 1: PESANAN MASUK */}
      {adminTab === 'orders' && (
        <IncomingOrdersTab
          orders={orders}
          onUpdateOrderStatus={onUpdateOrderStatus}
          onVerifyCustomerPayment={onVerifyCustomerPayment}
          updatingOrderId={updatingOrderId}
          loadingOrders={loadingOrders}
          errorOrders={errorOrders}
          onRetryOrders={onRetryOrders}
        />
      )}

      {/* TAB 2: KELOLA STOK & HARGA */}
      {adminTab === 'inventory' && (
        <InventoryTab
          inventoryDraft={inventoryDraft}
          onSaveInventory={onSaveInventory}
          loadingMedicines={loadingMedicines}
          errorMedicines={errorMedicines}
          onRetryMedicines={onRetryMedicines}
          onAddMedicine={onAddMedicine}
          onDeleteMedicine={onDeleteMedicine}
          askConfirmation={askConfirmation}
          canManageInventory={canManageInventory}
          savingInventory={savingInventory}
          deletingMedicineId={deletingMedicineId}
        />
      )}

      {/* TAB 3: LAPORAN PENJUALAN */}
      {adminTab === 'reports' && <SalesReportTab orders={orders} />}
    </div>
  );
}
