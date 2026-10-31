import React, { useState } from 'react';
import {BarChart3,ClipboardList,Menu,Package,PanelLeftClose,PanelLeftOpen,X,Sun,Moon,Monitor} from 'lucide-react';
import IncomingOrdersTab from './IncomingOrdersTab.jsx';
import InventoryTab from './InventoryTab.jsx';
import SalesReportTab from './SalesReportTab.jsx';

const pharmacyTabs = [
  { id: 'orders', label: 'Pesanan Masuk', Icon: ClipboardList },
  { id: 'inventory', label: 'Kelola Stok & Harga', Icon: Package },
  { id: 'reports', label: 'Laporan Penjualan', Icon: BarChart3 }
];

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
  onResetOrders,
  canManageInventory = false,
  savingInventory = false,
  deletingMedicineId = null,
  updatingOrderId = null,
  theme = 'system',
  onThemeChange
}) {
  const pendingOrdersCount = orders.filter((o) => o.orderStatus === 'Menunggu Konfirmasi').length;
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderMenuItems = (compact = false, onSelect = () => {}) => pharmacyTabs.map(({ id, label, Icon }) => {
    const active = adminTab === id;
    return <button key={id} type="button" role="tab" aria-selected={active} aria-label={label} title={compact ? label : undefined} onClick={() => { setAdminTab(id); onSelect(); }} className={`relative flex min-h-12 shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${compact ? 'justify-center px-0 md:w-full' : 'w-full'} ${active ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
      <Icon size={19} aria-hidden="true" />
      {!compact && <span className="flex-1">{label}</span>}
      {id === 'orders' && pendingOrdersCount > 0 && <span aria-label={`${pendingOrdersCount} pesanan menunggu konfirmasi`} className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] leading-none font-extrabold ${compact ? 'absolute right-1 top-0' : ''} ${active ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>{compact ? pendingOrdersCount > 9 ? '9+' : pendingOrdersCount : pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}</span>}
    </button>;
  });

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col">
      {/* Header 5. Dashboard Apotek */}
      <header className="border-b border-slate-200 pb-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Buka menu navigasi" aria-expanded={mobileMenuOpen} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 md:hidden"><Menu size={20} aria-hidden="true" /></button>
              <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-navy">Dashboard Apotek</h1>
              <span className="text-xs bg-primary-soft text-primary border border-sky-200 px-2.5 py-1 rounded-full font-semibold">
                Apotek Sehat
              </span>
              </div>
            </div>
            <p className="text-sm text-neutral mt-1">
              Kelola pesanan masuk, stok obat & laporan harian
            </p>
          </div>

                    
          <div className="flex flex-col items-end gap-2">
            {onThemeChange && (
              <button
                type="button"
                onClick={() =>
                  onThemeChange(
                    theme === 'light'
                      ? 'dark'
                      : theme === 'dark'
                        ? 'system'
                        : 'light'
                  )
                }
                title={
                  theme === 'light'
                    ? 'Tema terang'
                    : theme === 'dark'
                      ? 'Tema gelap'
                      : 'Sesuai perangkat'
                }
                aria-label="Ganti mode tampilan"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {theme === 'light' ? (
                  <Sun size={16} />
                ) : theme === 'dark' ? (
                  <Moon size={16} />
                ) : (
                  <Monitor size={16} />
                )}
              </button>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2 border border-slate-200 rounded-lg px-3 py-2 bg-white shadow-sm">
                <span className="text-xs font-bold text-slate-700">
                  Status Toko:
                </span>
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
        </div>
      </header>
      
      <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-start">
        <nav role="tablist" aria-label="Menu dashboard apotek" aria-orientation="vertical" className={`hidden shrink-0 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 transition-[width] duration-200 md:sticky md:top-6 md:flex ${sidebarExpanded ? 'md:w-60' : 'md:w-[4.5rem]'}`}>
          <button type="button" onClick={() => setSidebarExpanded((expanded) => !expanded)} aria-label={sidebarExpanded ? 'Sembunyikan nama menu' : 'Tampilkan nama menu'} aria-expanded={sidebarExpanded} title={sidebarExpanded ? 'Sembunyikan menu' : 'Tampilkan menu'} className={`mb-1 flex h-10 items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 ${sidebarExpanded ? 'justify-end px-3' : 'justify-center'}`}>
            {sidebarExpanded ? <PanelLeftClose size={18} aria-hidden="true" /> : <PanelLeftOpen size={18} aria-hidden="true" />}
            <span className="sr-only">{sidebarExpanded ? 'Sembunyikan nama menu' : 'Tampilkan nama menu'}</span>
          </button>
          {renderMenuItems(!sidebarExpanded)}
        </nav>

        <div className="min-w-0 flex-1">
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
          onResetOrders={onResetOrders}
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
      {adminTab === 'reports' && <SalesReportTab orders={orders} onResetOrders={onResetOrders} />}
        </div>
      </div>

      {mobileMenuOpen && <div className="fixed inset-0 z-[80] md:hidden">
        <button type="button" aria-label="Tutup menu navigasi" onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-slate-950/55" />
        <nav role="tablist" aria-label="Menu dashboard apotek" aria-orientation="vertical" className="absolute inset-y-0 left-0 flex w-[min(82vw,22rem)] flex-col bg-white p-5 shadow-2xl animate-in slide-in-from-left duration-200">
          <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-5">
            <div><p className="text-xs font-bold uppercase tracking-widest text-primary">Apotek Sehat</p><h2 className="mt-1 text-lg font-extrabold text-navy">Menu Apotek</h2></div>
            <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Tutup menu navigasi" className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"><X size={22} aria-hidden="true" /></button>
          </div>
          <div className="space-y-2">{renderMenuItems(false, () => setMobileMenuOpen(false))}</div>
        </nav>
      </div>}
    </div>
  );
}
