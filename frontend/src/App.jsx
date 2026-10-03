import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DemoBanner from './components/common/DemoBanner.jsx';
import Footer from './components/common/Footer.jsx';
import CustomerHomeView from './components/customer/CustomerHomeView.jsx';
import CheckoutView from './components/customer/CheckoutView.jsx';
import QRISPaymentView from './components/customer/QRISPaymentView.jsx';
import PharmacyLoginView from './components/pharmacy/PharmacyLoginView.jsx';
import PharmacyDashboardView from './components/pharmacy/PharmacyDashboardView.jsx';
import { apiService } from './services/api.js';

export default function App() {
  // Router / Navigation state
  const [currentView, setCurrentView] = useState('customer'); // 'customer' | 'checkout' | 'qris' | 'admin-login' | 'admin-dashboard'
  const [adminTab, setAdminTab] = useState('orders'); // 'orders' | 'inventory' | 'reports'

  // Application Data State
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('medistock_token')));
  const [token, setToken] = useState(() => localStorage.getItem('medistock_token') || null);

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
      setMedicines(medRes.data);
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

  // Initial mount data load
  useEffect(() => {
    fetchPharmacyInfo();
    fetchMedicines();
    fetchOrders();
  }, [fetchPharmacyInfo, fetchMedicines, fetchOrders]);

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
    if (med.stock <= 0 || med.status === 'Habis') return;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === med.id);
      if (existing) {
        return prev.map((item) => (item.id === med.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { ...med, qty: 1 }];
    });
  };

  const updateCartQty = (medId, delta) => {
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
      items: cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price })),
      subtotal: cartSubtotal,
      serviceFee,
      totalAmount: cartTotal
    };

    const res = await apiService.createOrder(orderPayload);
    if (res && res.success) {
      setCurrentOrder(res.data);
      setCurrentView('qris');
    } else {
      alert(res?.message || 'Gagal membuat pesanan di server. Silakan coba lagi.');
    }
  };

  const handleConfirmPayment = async () => {
    if (currentOrder) {
      await apiService.confirmPayment(currentOrder.id);
      fetchOrders();
      fetchMedicines();
    }
    setShowSuccessModal(true);
  };

  const resetCustomerFlow = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '', address: '' });
    setCurrentOrder(null);
    setShowSuccessModal(false);
    setCurrentView('customer');
  };

  // Pharmacy Admin Handlers
  const handlePharmacyLogin = async (username, password) => {
    const res = await apiService.loginPharmacy(username, password);
    if (res && res.success) {
      localStorage.setItem('medistock_token', res.token);
      localStorage.setItem('medistock_user', JSON.stringify(res.user));
      setIsLoggedIn(true);
      setToken(res.token);
      setCurrentView('admin-dashboard');
      fetchPharmacyInfo();
      fetchMedicines();
      fetchOrders();
      return { success: true };
    } else {
      return { success: false, message: res?.message || 'Username/email atau password tidak valid.' };
    }
  };

  const handlePharmacyLogout = () => {
    localStorage.removeItem('medistock_token');
    localStorage.removeItem('medistock_user');
    setIsLoggedIn(false);
    setToken(null);
    setCurrentView('admin-login');
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
    const res = await apiService.updateOrderStatus(orderId, newStatus, token);
    if (res && res.success) {
      fetchOrders();
    } else {
      alert(res?.message || 'Gagal memperbarui status pesanan.');
    }
  };

  const handleSaveInventory = async () => {
    const res = await apiService.saveInventory(inventoryDraft, token);
    if (res && res.success) {
      setMedicines(res.data);
      alert('Perubahan stok & harga berhasil disimpan!');
    } else {
      alert(res?.message || 'Gagal memperbarui inventaris.');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-slate-800 selection:text-white font-sans bg-white text-slate-900">
      {/* Top Demo Route Switcher Bar */}
      <DemoBanner
        currentView={currentView}
        setCurrentView={setCurrentView}
        isLoggedIn={isLoggedIn}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col bg-white">
        {currentView === 'customer' && (
          <CustomerHomeView
            medicines={medicines}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            cart={cart}
            addToCart={addToCart}
            updateCartQty={updateCartQty}
            cartTotal={cartTotal}
            isStoreOpen={isStoreOpen}
            onProceedToCheckout={handleProceedToCheckout}
            loadingMedicines={loadingMedicines}
            errorMedicines={errorMedicines}
            onRetryMedicines={() => fetchMedicines(searchQuery)}
          />
        )}

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
            setInventoryDraft={setInventoryDraft}
            onSaveInventory={handleSaveInventory}
            onLogout={handlePharmacyLogout}
            loadingOrders={loadingOrders}
            errorOrders={errorOrders}
            onRetryOrders={fetchOrders}
            loadingMedicines={loadingMedicines}
            errorMedicines={errorMedicines}
            onRetryMedicines={fetchMedicines}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

