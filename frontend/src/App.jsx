import React, { useState, useEffect, useMemo } from 'react';
import DemoBanner from './components/common/DemoBanner.jsx';
import Footer from './components/common/Footer.jsx';
import CustomerHomeView from './components/customer/CustomerHomeView.jsx';
import CheckoutView from './components/customer/CheckoutView.jsx';
import QRISPaymentView from './components/customer/QRISPaymentView.jsx';
import PharmacyLoginView from './components/pharmacy/PharmacyLoginView.jsx';
import PharmacyDashboardView from './components/pharmacy/PharmacyDashboardView.jsx';
import { apiService } from './services/api.js';

const INITIAL_MEDICINES = [
  { id: 'MED-1', name: 'Paracetamol 500mg', desc: 'Pereda demam & nyeri ringan hingga sedang', price: 12500, stock: 45, status: 'Tersedia' },
  { id: 'MED-2', name: 'Amoxicillin 500mg', desc: 'Antibiotik penanganan infeksi bakteri', price: 28000, stock: 20, status: 'Tersedia' },
  { id: 'MED-3', name: 'Vitamin C 1000mg', desc: 'Suplemen daya tahan tubuh tablet kunyah', price: 35000, stock: 15, status: 'Tersedia' },
  { id: 'MED-4', name: 'Antasida Doen Tablet', desc: 'Obat maag & asam lambung berlebih', price: 8500, stock: 30, status: 'Tersedia' },
  { id: 'MED-5', name: 'Mefenamic Acid 500mg', desc: 'Pereda nyeri sakit gigi & nyeri haid', price: 18000, stock: 0, status: 'Habis' }
];

const INITIAL_ORDERS = [
  {
    id: 'MDS-9824',
    customerName: 'Budi Santoso',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 12, Kel. Menteng',
    deliveryType: 'Pengantaran',
    items: [
      { name: 'Paracetamol 500mg', qty: 2, price: 12500 },
      { name: 'Vitamin C 1000mg', qty: 1, price: 35000 }
    ],
    subtotal: 60000,
    serviceFee: 3000,
    totalAmount: 63000,
    paymentStatus: 'Lunas (QRIS)',
    orderStatus: 'Menunggu Konfirmasi',
    timestamp: '2026-09-20 20:45'
  },
  {
    id: 'MDS-9823',
    customerName: 'Siti Rahma',
    phone: '085711223344',
    address: '-',
    deliveryType: 'Ambil Sendiri',
    items: [
      { name: 'Amoxicillin 500mg', qty: 1, price: 28000 }
    ],
    subtotal: 28000,
    serviceFee: 3000,
    totalAmount: 31000,
    paymentStatus: 'Lunas (QRIS)',
    orderStatus: 'Selesai',
    timestamp: '2026-09-20 19:15'
  },
  {
    id: 'MDS-9822',
    customerName: 'Deni Kurniawan',
    phone: '081988776655',
    address: 'Jl. Sudirman No. 45',
    deliveryType: 'Pengantaran',
    items: [
      { name: 'Paracetamol 500mg', qty: 1, price: 12500 },
      { name: 'Antasida Doen Tablet', qty: 2, price: 8500 }
    ],
    subtotal: 29500,
    serviceFee: 3000,
    totalAmount: 32500,
    paymentStatus: 'Lunas (QRIS)',
    orderStatus: 'Selesai',
    timestamp: '2026-09-20 18:30'
  }
];

export default function App() {
  // Router / Navigation state
  const [currentView, setCurrentView] = useState('customer'); // 'customer' | 'checkout' | 'qris' | 'admin-login' | 'admin-dashboard'
  const [adminTab, setAdminTab] = useState('orders'); // 'orders' | 'inventory' | 'reports'

  // Shared Application State
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [medicines, setMedicines] = useState(INITIAL_MEDICINES);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);

  // Customer State
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState('Pengantaran');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Inventory Editing Draft State
  const [inventoryDraft, setInventoryDraft] = useState([]);

  // Fetch initial data from Backend API
  const fetchAllData = async () => {
    try {
      const pInfo = await apiService.getPharmacyInfo();
      if (pInfo && pInfo.success) {
        setIsStoreOpen(pInfo.data.isOpen);
      }

      const medRes = await apiService.getMedicines();
      if (medRes && medRes.success) {
        setMedicines(medRes.data);
      }

      const ordRes = await apiService.getOrders();
      if (ordRes && ordRes.success) {
        setOrders(ordRes.data);
      }
    } catch (err) {
      console.warn('Backend API connection warning:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

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

  // Navigation Handlers
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

    // Try API call
    const res = await apiService.createOrder(orderPayload);
    let newOrder;
    if (res && res.success) {
      newOrder = res.data;
    } else {
      // Local fallback
      newOrder = {
        id: `MDS-${Math.floor(1000 + Math.random() * 9000)}`,
        ...orderPayload,
        paymentStatus: 'Lunas (QRIS)',
        orderStatus: 'Menunggu Konfirmasi',
        timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
      };
    }

    setCurrentOrder(newOrder);
    setCurrentView('qris');
  };

  const handleConfirmPayment = async () => {
    if (currentOrder) {
      await apiService.confirmPayment(currentOrder.id);

      setOrders((prev) => [currentOrder, ...prev]);

      // Deduct stock locally
      setMedicines((prev) =>
        prev.map((med) => {
          const ordered = currentOrder.items.find((i) =>
            i.name.toLowerCase().startsWith(med.name.split(' ')[0].toLowerCase())
          );
          if (ordered) {
            const newStock = Math.max(0, med.stock - ordered.qty);
            return { ...med, stock: newStock, status: newStock === 0 ? 'Habis' : med.status };
          }
          return med;
        })
      );
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
      setIsLoggedIn(true);
      setToken(res.token);
      setCurrentView('admin-dashboard');
      fetchAllData();
    } else {
      // Prototype fallback
      if ((username === 'apotek@medistock.id' || username === 'admin') && password === 'password123') {
        setIsLoggedIn(true);
        setCurrentView('admin-dashboard');
      } else {
        alert(res?.message || 'Login gagal.');
      }
    }
  };

  const handleToggleStoreOpen = async (newStatus) => {
    setIsStoreOpen(newStatus);
    await apiService.toggleStoreStatus(newStatus, token);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
    );
    await apiService.updateOrderStatus(orderId, newStatus, token);
  };

  const handleSaveInventory = async () => {
    setMedicines(inventoryDraft);
    const res = await apiService.saveInventory(inventoryDraft, token);
    if (res && res.success) {
      setMedicines(res.data);
    }
    alert('Perubahan stok & harga berhasil disimpan!');
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
            onLogout={() => {
              setIsLoggedIn(false);
              setToken(null);
              setCurrentView('admin-login');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
