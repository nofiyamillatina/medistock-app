import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DemoBanner from './components/common/DemoBanner.jsx';
import Footer from './components/common/Footer.jsx';
import CustomerHomeView from './components/customer/CustomerHomeView.jsx';
import CheckoutView from './components/customer/CheckoutView.jsx';
import QRISPaymentView from './components/customer/QRISPaymentView.jsx';
import CustomerHistoryView from './components/customer/CustomerHistoryView.jsx';
import CustomerAuthView from './components/customer/CustomerAuthView.jsx';
import PharmacyLoginView from './components/pharmacy/PharmacyLoginView.jsx';
import PharmacyDashboardView from './components/pharmacy/PharmacyDashboardView.jsx';
import { apiService } from './services/api.js';
import { getDisplayStock, isValidStockInput, STOCK_VALIDATION_MESSAGE } from './utils/stock.js';

function SplashScreen() {
  return <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white" role="status" aria-label="MEDISTOCK sedang memuat">
    <img src="/images/medistock-logo.png" alt="MEDISTOCK" className="h-auto w-56 sm:w-72" />
    <p className="mt-8 text-sm font-semibold tracking-wide text-slate-500">Menyiapkan MEDISTOCK...</p>
    <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/5 animate-loading-progress rounded-full bg-primary" /></div>
  </div>;
}

export default function App() {
  // Router / Navigation state
  const [currentView, setCurrentView] = useState('customer'); // customer | customer-login | checkout | qris | admin-login | admin-dashboard
  const [customerAuthReturnView, setCustomerAuthReturnView] = useState('customer');
  const [adminTab, setAdminTab] = useState('orders'); // 'orders' | 'inventory' | 'reports'

  // Application Data State
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('medistock_token')));
  const [token, setToken] = useState(() => localStorage.getItem('medistock_token') || null);
  const [customerUser, setCustomerUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('medistock_customer_user') || 'null'); } catch { return null; }
  });

  // Loading & Error States
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [errorMedicines, setErrorMedicines] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [errorOrders, setErrorOrders] = useState(null);
  const [loadingPharmacyInfo, setLoadingPharmacyInfo] = useState(false);
  const [errorPharmacyInfo, setErrorPharmacyInfo] = useState(null);

  // Customer State
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState('Pengantaran');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Inventory Editing Draft State
  const [inventoryDraft, setInventoryDraft] = useState([]);
  const [savingInventory, setSavingInventory] = useState(false);
  const [deletingMedicineId, setDeletingMedicineId] = useState(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const pharmacyUser = (() => {
    try { return JSON.parse(localStorage.getItem('medistock_user') || 'null'); } catch { return null; }
  })();
  const canManageInventory = isLoggedIn && pharmacyUser?.role === 'pharmacy_staff';

  // Data Fetching Handlers
  const fetchPharmacyInfo = useCallback(async () => {
    setLoadingPharmacyInfo(true);
    setErrorPharmacyInfo(null);
    const pInfo = await apiService.getPharmacyInfo();
    if (pInfo && pInfo.success) {
      setIsStoreOpen(pInfo.data.isOpen);
    } else {
      setErrorPharmacyInfo(pInfo?.message || 'Gagal memuat informasi apotek.');
    }
    setLoadingPharmacyInfo(false);
  }, []);

  const fetchMedicines = useCallback(async (query = '') => {
    setLoadingMedicines(true);
    setErrorMedicines(null);
    const medRes = await apiService.getMedicines(query);
    if (medRes && medRes.success) {
      setMedicines(medRes.data.map((medicine) => ({ ...medicine, stock: getDisplayStock(medicine.stock) })));
    } else {
      setErrorMedicines(medRes?.message || 'Gagal memuat katalog obat dari server.');
    }
    setLoadingMedicines(false);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setErrorOrders(null);
    const ordRes = await apiService.getOrders();
    if (ordRes && ordRes.success) {
      setOrders(ordRes.data);
    } else {
      setErrorOrders(ordRes?.message || 'Gagal memuat data pesanan dari server.');
    }
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    if (currentView === 'admin-dashboard' && canManageInventory) fetchOrders();
  }, [currentView, canManageInventory, fetchOrders]);

  // Initial mount data load
  useEffect(() => {
    let isActive = true;
    const minimumSplashDuration = new Promise((resolve) => window.setTimeout(resolve, 5000));
    const loadInitialData = async () => {
      await Promise.all([fetchPharmacyInfo(), fetchMedicines()]);
      await minimumSplashDuration;
      if (isActive) setShowSplash(false);
    };
    loadInitialData();
    return () => { isActive = false; };
  }, [fetchPharmacyInfo, fetchMedicines]);

  // Refresh the customer catalog when the app returns to the foreground, and periodically while viewing it.
  useEffect(() => {
    if (currentView !== 'customer') return undefined;
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') fetchMedicines();
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);
    const intervalId = window.setInterval(refreshOnFocus, 20000);
    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
      window.clearInterval(intervalId);
    };
  }, [currentView, fetchMedicines]);

  // Keep inventory draft in sync with medicines state
  useEffect(() => {
    setInventoryDraft(JSON.parse(JSON.stringify(medicines)));
  }, [medicines]);

  // Cart Functions
  const addToCart = (med) => {
    if (!isStoreOpen) {
      alert('Mohon maaf, toko sedang tutup saat ini.');
      return;
    }
    const availableStock = getDisplayStock(med.stock);
    if (availableStock === 0) return;
    const existingCartItem = cart.find((item) => item.id === med.id);
    if (existingCartItem && existingCartItem.qty >= availableStock) {
      alert(`Stok tersedia hanya ${availableStock}.`);
      return;
    }

    setCurrentOrder(null);
    setShowSuccessModal(false);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === med.id);
      if (existing) return prev.map((item) => (item.id === med.id ? { ...item, qty: item.qty + 1 } : item));
      return [...prev, { ...med, stock: availableStock, qty: 1 }];
    });
  };

  const updateCartQty = (medId, delta) => {
    const medicine = medicines.find((item) => item.id === medId);
    const currentItem = cart.find((item) => item.id === medId);
    const availableStock = medicine ? getDisplayStock(medicine.stock) : 0;
    if (!currentItem || delta === 0) return;
    if (delta > 0 && medicine && currentItem.qty + delta > availableStock) {
      alert(`Stok tersedia hanya ${availableStock}.`);
      return;
    }

    setCurrentOrder(null);
    setShowSuccessModal(false);
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === medId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  const serviceFee = cart.length > 0 ? 3000 : 0;
  const cartTotal = cartSubtotal + serviceFee;

  // Navigation & Checkout Handlers
  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    if (!customerUser) {
      setCustomerAuthReturnView('checkout');
      setCurrentView('customer-login');
      return;
    }
    const unavailable = cart.find((item) => {
      const medicine = medicines.find((candidate) => candidate.id === item.id);
      return !medicine || item.qty > getDisplayStock(medicine.stock);
    });
    if (unavailable) {
      const medicine = medicines.find((candidate) => candidate.id === unavailable.id);
      alert(medicine ? `Stok ${medicine.name} tersedia hanya ${getDisplayStock(medicine.stock)}.` : 'Obat tidak lagi tersedia. Katalog akan diperbarui.');
      fetchMedicines();
      return;
    }
    setCurrentView('checkout');
  };

  const handlePayViaQRIS = async (e) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Mohon lengkapi Nama dan Nomor Telepon.');
      return;
    }
    if (deliveryMethod === 'Pengantaran' && !customerInfo.address) {
      alert('Mohon lengkapi Alamat Pengantaran.');
      return;
    }

    const orderPayload = {
      customerName: customerInfo.name,
      phone: customerInfo.phone,
      address: deliveryMethod === 'Pengantaran' ? customerInfo.address : '-',
      deliveryType: deliveryMethod,
      // Keep catalog ID and a numeric quantity in the order payload. The
      // backend uses the ID for stock validation; name/price remain for the
      // existing order-item schema and display flow.
      items: cart.map((c) => ({
        medicineId: String(c.id),
        name: c.name,
        qty: Number(c.qty),
        price: Number(c.price)
      })),
      subtotal: cartSubtotal,
      serviceFee,
      totalAmount: cartTotal
    };

    setSubmittingOrder(true);
    try {
      const res = await apiService.createOrder(orderPayload);
      if (res && res.success) {
        setCurrentOrder(res.data);
        setCustomerInfo({ name: '', phone: '', address: '' });
        setCurrentView('qris');
      } else {
        alert(res?.message || 'Gagal membuat pesanan di server. Silakan coba lagi.');
        fetchMedicines();
      }
    } finally { setSubmittingOrder(false); }
  };

  const handleConfirmPayment = async () => {
    setConfirmingPayment(true);
    try {
      if (currentOrder) {
        const result = await apiService.confirmPayment(currentOrder.id);
        if (!result?.success) {
          alert(result?.message || 'Pembayaran gagal diproses. Periksa kembali stok obat.');
          fetchMedicines();
          return;
        }
        fetchOrders();
        fetchMedicines();
        setCart([]);
      }
      setShowSuccessModal(true);
    } finally { setConfirmingPayment(false); }
  };

  const resetCustomerFlow = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '', address: '' });
    setCurrentOrder(null);
    setShowSuccessModal(false);
    setCurrentView('customer');
  };

  // Pharmacy Admin Handlers
  const handlePharmacyLogin = async (email, password) => {
    const res = await apiService.loginPharmacy(email, password);
    if (res && res.success) {
      localStorage.setItem('medistock_token', res.token);
      localStorage.setItem('medistock_user', JSON.stringify(res.user));
      setIsLoggedIn(true);
      setToken(res.token);
      setCurrentView('admin-dashboard');
      fetchPharmacyInfo();
      fetchMedicines();
      return { success: true };
    } else {
      return { success: false, message: res?.message || 'Email atau password tidak valid.' };
    }
  };

  const handlePharmacyLogout = () => {
    localStorage.removeItem('medistock_token');
    localStorage.removeItem('medistock_user');
    setIsLoggedIn(false);
    setToken(null);
    setCurrentView('admin-login');
  };

  const handleCustomerAuth = async (authenticate) => {
    const result = await authenticate();
    if (result?.success) {
      localStorage.setItem('medistock_customer_token', result.token);
      localStorage.setItem('medistock_customer_user', JSON.stringify(result.user));
      setCustomerUser(result.user);
      setCurrentView(customerAuthReturnView);
      return { success: true };
    }
    return { success: false, message: result?.message || 'Email atau password tidak valid.' };
  };

  const handleCustomerLogin = (email, password) => (
    handleCustomerAuth(() => apiService.loginCustomer(email, password))
  );

  const handleCustomerRegister = (email, password) => (
    handleCustomerAuth(() => apiService.registerCustomer(email, password))
  );

  const handleCustomerLogout = () => {
    localStorage.removeItem('medistock_customer_token');
    localStorage.removeItem('medistock_customer_user');
    setCustomerUser(null);
    setCurrentView('customer');
  };

  const handleOpenCustomerHistory = () => {
    if (customerUser) {
      setCurrentView('customer-history');
      return;
    }
    setCustomerAuthReturnView('customer-history');
    setCurrentView('customer-login');
  };

  const handleOpenCustomerLogin = () => {
    setCustomerAuthReturnView('customer');
    setCurrentView('customer-login');
  };

  const handleToggleStoreOpen = async (newStatus) => {
    setIsStoreOpen(newStatus);
    const res = await apiService.toggleStoreStatus(newStatus, token);
    if (res && res.success) {
      fetchPharmacyInfo();
    } else {
      alert(res?.message || 'Gagal mengubah status apotek.');
      fetchPharmacyInfo();
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await apiService.updateOrderStatus(orderId, newStatus, token);
      if (res && res.success) {
        fetchOrders();
        if (newStatus === 'Dibatalkan') fetchMedicines();
      }
      else if (res?.message?.includes('Token tidak valid') || res?.message?.includes('Token autentikasi tidak ditemukan')) {
        localStorage.removeItem('medistock_token');
        localStorage.removeItem('medistock_user');
        setIsLoggedIn(false);
        setToken(null);
        setCurrentView('admin-login');
        alert('Sesi apotek sudah berakhir. Silakan login kembali sebelum memperbarui pesanan.');
      } else alert(res?.message || 'Gagal memperbarui status pesanan.');
    } finally { setUpdatingOrderId(null); }
  };

  const handleCustomerCompleteDelivery = async (orderId) => {
    const result = await apiService.completeDeliveryOrder(orderId);
    if (result?.success) fetchOrders();
    return result;
  };

  const handleOpenPharmacy = async () => {
    if (!token) {
      setCurrentView('admin-login');
      return;
    }
    const result = await apiService.verifyPharmacyToken(token);
    if (result?.success && result.user?.role === 'pharmacy_staff') setCurrentView('admin-dashboard');
    else if (result?.success) {
      alert('Akun ini tidak memiliki akses ke dashboard apotek.');
      setCurrentView('admin-login');
    }
    else if (result?.httpStatus === 401) {
      localStorage.removeItem('medistock_token');
      localStorage.removeItem('medistock_user');
      setIsLoggedIn(false);
      setToken(null);
      setCurrentView('admin-login');
    } else alert(result?.message || 'Sesi apotek belum dapat diverifikasi. Coba lagi.');
  };

  const handleSaveInventory = async (items = inventoryDraft) => {
    if (!canManageInventory || savingInventory) return;
    if (!items.every((item) => isValidStockInput(item.stock))) {
      alert(STOCK_VALIDATION_MESSAGE);
      return false;
    }
    setSavingInventory(true);
    try {
      const currentById = new Map(medicines.map((medicine) => [medicine.id, medicine]));
      const changedItems = items.reduce((changed, item) => {
        const current = currentById.get(item.id);
        if (!current) return changed;
        const updates = { id: item.id };
        for (const field of ['name', 'desc', 'price', 'stock', 'image_url']) {
          const nextValue = field === 'stock' ? Number(item[field]) : item[field] ?? null;
          const currentValue = current[field] ?? null;
          if (nextValue !== currentValue) updates[field] = nextValue;
        }
        if (Object.keys(updates).length > 1) {
          if (Object.hasOwn(updates, 'name')) updates.restrictedConfirmed = item.restrictedConfirmed;
          changed.push(updates);
        }
        return changed;
      }, []);
      if (changedItems.length === 0) return true;
      const res = await apiService.saveInventory(changedItems, token);
      if (res && res.success) {
        await fetchMedicines();
        alert('Perubahan inventaris berhasil disimpan!');
        return true;
      }
      alert(res?.message || 'Gagal memperbarui inventaris.');
      return false;
    } finally { setSavingInventory(false); }
  };

  const handleAddMedicine = async (medicine) => {
    if (!canManageInventory || savingInventory) return { success: false, message: 'Akses ditolak atau permintaan sedang diproses.' };
    if (!isValidStockInput(medicine.stock) || typeof medicine.stock !== 'number') {
      return { success: false, message: STOCK_VALIDATION_MESSAGE };
    }
    setSavingInventory(true);
    try {
      const res = await apiService.createMedicine(medicine, token);
      if (res?.success) await fetchMedicines();
      return res;
    } finally { setSavingInventory(false); }
  };

  const handleDeleteMedicine = async (medicine) => {
    if (!canManageInventory || !window.confirm('Apakah Anda yakin ingin menghapus obat ini?')) return false;
    setDeletingMedicineId(medicine.id);
    try {
      const res = await apiService.deleteMedicine(medicine.id, token);
      if (res?.success) {
        await fetchMedicines();
        return true;
      }
      alert(res?.message || 'Gagal menghapus obat.');
      return false;
    } finally { setDeletingMedicineId(null); }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-primary selection:text-white font-sans bg-slate-50 text-navy">
      {showSplash && <SplashScreen />}
      {/* Top Demo Route Switcher Bar */}
      <DemoBanner
        currentView={currentView}
        setCurrentView={setCurrentView}
        isLoggedIn={isLoggedIn}
        onOpenPharmacy={handleOpenPharmacy}
        onCustomerLogin={handleOpenCustomerLogin}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col bg-slate-50">
        {currentView === 'customer' && (
          <CustomerHomeView
            medicines={medicines}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            cart={cart}
            addToCart={addToCart}
            updateCartQty={updateCartQty}
            cartTotal={cartTotal}
            hasPlacedOrder={Boolean(currentOrder)}
            isStoreOpen={isStoreOpen}
            onProceedToCheckout={handleProceedToCheckout}
            loadingMedicines={loadingMedicines}
            errorMedicines={errorMedicines}
            onRetryMedicines={() => fetchMedicines(searchQuery)}
            onOpenHistory={handleOpenCustomerHistory}
            onCustomerLogin={handleOpenCustomerLogin}
            customerUser={customerUser}
            onCustomerLogout={handleCustomerLogout}
          />
        )}

        {currentView === 'customer-login' && (
          <CustomerAuthView onLogin={handleCustomerLogin} onRegister={handleCustomerRegister} />
        )}

        {currentView === 'customer-history' && customerUser && <CustomerHistoryView onLoadOrders={apiService.getCustomerOrders} onCompleteDelivery={handleCustomerCompleteDelivery} onBack={() => setCurrentView('customer')} />}

        {currentView === 'checkout' && (
          <CheckoutView
            cart={cart}
            updateCartQty={updateCartQty}
            deliveryMethod={deliveryMethod}
            setDeliveryMethod={setDeliveryMethod}
            customerInfo={customerInfo}
            setCustomerInfo={setCustomerInfo}
            cartSubtotal={cartSubtotal}
            serviceFee={serviceFee}
            cartTotal={cartTotal}
            onPayViaQRIS={handlePayViaQRIS}
            submittingOrder={submittingOrder}
            onBack={() => setCurrentView('customer')}
          />
        )}

        {currentView === 'qris' && (
          <QRISPaymentView
            currentOrder={currentOrder}
            cartTotal={cartTotal}
            onConfirmPayment={handleConfirmPayment}
            showSuccessModal={showSuccessModal}
            onReset={resetCustomerFlow}
            onOpenHistory={handleOpenCustomerHistory}
            confirmingPayment={confirmingPayment}
          />
        )}

        {currentView === 'admin-login' && (
          <PharmacyLoginView onLoginSuccess={handlePharmacyLogin} />
        )}

        {currentView === 'admin-dashboard' && (
          <PharmacyDashboardView
            isStoreOpen={isStoreOpen}
            setIsStoreOpen={handleToggleStoreOpen}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            inventoryDraft={inventoryDraft}
            onSaveInventory={handleSaveInventory}
            onLogout={handlePharmacyLogout}
            loadingOrders={loadingOrders}
            errorOrders={errorOrders}
            onRetryOrders={fetchOrders}
            loadingMedicines={loadingMedicines}
            errorMedicines={errorMedicines}
            onRetryMedicines={fetchMedicines}
            onAddMedicine={handleAddMedicine}
            onDeleteMedicine={handleDeleteMedicine}
            canManageInventory={canManageInventory}
            savingInventory={savingInventory}
            deletingMedicineId={deletingMedicineId}
            updatingOrderId={updatingOrderId}
          />
        )}
      </main>

      {/* Footer */}
      {currentView !== 'qris' && <Footer />}
    </div>
  );
}
