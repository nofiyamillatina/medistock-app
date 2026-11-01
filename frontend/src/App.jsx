import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import DemoBanner from './components/common/DemoBanner.jsx';
import Footer from './components/common/Footer.jsx';
import AppDialog from './components/common/AppDialog.jsx';
import CustomerHomeView from './components/customer/CustomerHomeView.jsx';
import CheckoutView from './components/customer/CheckoutView.jsx';
import QRISPaymentView from './components/customer/QRISPaymentView.jsx';
import CustomerHistoryView from './components/customer/CustomerHistoryView.jsx';
import CustomerAuthView from './components/customer/CustomerAuthView.jsx';
import PharmacySelectionView from './components/customer/PharmacySelectionView.jsx';
import PharmacyLoginView from './components/pharmacy/PharmacyLoginView.jsx';
import PharmacyDashboardView from './components/pharmacy/PharmacyDashboardView.jsx';
import { apiService } from './services/api.js';
import { formatIDR } from './services/formatters.js';
import { getDisplayStock, isValidStockInput, STOCK_VALIDATION_MESSAGE } from './utils/stock.js';
import PlatformAdminPortal from './components/platformAdmin/PlatformAdminPortal.jsx';

function SplashScreen() {
  return <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white" role="status" aria-label="MEDISTOCK sedang memuat">
    <img src="/images/medistock-logo.png" alt="MEDISTOCK" className="h-auto w-56 sm:w-72" />
    <p className="mt-8 text-sm font-semibold tracking-wide text-slate-500">MEDISTOCK...</p>
    <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/5 animate-loading-progress rounded-full bg-primary" /></div>
  </div>;
}

function MainApplication() {
  // Mode website: customer atau pharmacy
  const appMode = import.meta.env.VITE_APP_MODE || 'demo';

  // Halaman pertama sesuai website yang dibuka
  
const [currentView, setCurrentViewState] = useState(() => {
  if (appMode === 'customer') {
    const savedToken = localStorage.getItem('medistock_customer_token');
    const savedView = sessionStorage.getItem('medistock_customer_view');

    if (!savedToken) return 'customer-login';

    return ['customer', 'pharmacy-choice'].includes(savedView)
      ? savedView
      : 'pharmacy-choice';
  }

  if (appMode === 'pharmacy') {
    return localStorage.getItem('medistock_token')
      ? 'admin-dashboard'
      : 'admin-login';
  }

  return 'customer';
});

  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;
  const setCurrentView = useCallback((nextView) => {
    const resolvedView = typeof nextView === 'function' ? nextView(currentViewRef.current) : nextView;
    if (!resolvedView || resolvedView === currentViewRef.current) return;
    window.history.pushState({ ...window.history.state, medistockView: resolvedView }, '');
    currentViewRef.current = resolvedView;
    setCurrentViewState(resolvedView);
  }, []);
  useEffect(() => {
    window.history.replaceState({ ...window.history.state, medistockView: currentViewRef.current }, '');
    const restoreInternalView = (event) => {
      const nextView = event.state?.medistockView;
      if (typeof nextView !== 'string') return;
      if (appMode === 'customer' && ['admin-login', 'admin-dashboard'].includes(nextView)) return;
      if (appMode === 'pharmacy' && !['admin-login', 'admin-dashboard'].includes(nextView)) return;
      const customerProtectedViews = ['customer', 'pharmacy-choice', 'checkout', 'qris', 'cash-order', 'customer-history'];
      const pharmacyTokenMissing = appMode === 'pharmacy' && nextView === 'admin-dashboard' && !localStorage.getItem('medistock_token');
      const customerTokenMissing = appMode === 'customer' && customerProtectedViews.includes(nextView) && !localStorage.getItem('medistock_customer_token');
      const safeView = pharmacyTokenMissing ? 'admin-login' : customerTokenMissing ? 'customer-login' : nextView;
      if (safeView !== nextView) window.history.replaceState({ ...event.state, medistockView: safeView }, '');
      currentViewRef.current = safeView;
      setCurrentViewState(safeView);
    };
    window.addEventListener('popstate', restoreInternalView);
    return () => window.removeEventListener('popstate', restoreInternalView);
  }, []);
  useEffect(() => {
  if (appMode !== 'customer') return;

  if (['customer', 'pharmacy-choice'].includes(currentView)) {
    sessionStorage.setItem('medistock_customer_view', currentView);
  }
}, [appMode, currentView]);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('medistock_theme');
    return ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'system';
  });
  const [adminTab, setAdminTabState] = useState(() => {
    const savedTab = sessionStorage.getItem('medistock_pharmacy_admin_tab');
    return ['orders', 'inventory', 'reports'].includes(savedTab) ? savedTab : 'orders';
  }); // 'orders' | 'inventory' | 'reports'
  const setAdminTab = useCallback((nextTab) => {
    const resolvedTab = typeof nextTab === 'function' ? nextTab(adminTab) : nextTab;
    if (!['orders', 'inventory', 'reports'].includes(resolvedTab)) return;
    sessionStorage.setItem('medistock_pharmacy_admin_tab', resolvedTab);
    setAdminTabState(resolvedTab);
  }, [adminTab]);

  // Application Data State
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [pharmacies, setPharmacies] = useState([]);
  const [loadingPharmacies, setLoadingPharmacies] = useState(true);
  const [errorPharmacies, setErrorPharmacies] = useState('');
  const [selectedPharmacyId, setSelectedPharmacyId] = useState(() => appMode === 'customer'
    ? localStorage.getItem('medistock_selected_pharmacy') || ''
    : localStorage.getItem('medistock_selected_pharmacy') || 'APOTEK-1');
  const [showSplash, setShowSplash] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const hasLoadedMedicines = useRef(false);
  const [orders, setOrders] = useState([]);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem('medistock_token')));
  const [token, setToken] = useState(() => localStorage.getItem('medistock_token') || null);
  const [customerUser, setCustomerUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('medistock_customer_user') || 'null'); } catch { return null; }
  });

  // Pulihkan sesi login setelah browser di-refresh.
  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (appMode === 'customer') {
        const savedToken = localStorage.getItem('medistock_customer_token');

        if (!savedToken) return;

        const result = await apiService.verifyCustomerToken(savedToken);

        if (!active) return;

        if (result.success && result.user?.role === 'customer') {
          localStorage.setItem(
            'medistock_customer_user',
            JSON.stringify(result.user)
          );
          setCustomerUser(result.user);
          const savedView = sessionStorage.getItem('medistock_customer_view');

          setCurrentView(
            ['customer', 'pharmacy-choice'].includes(savedView)
              ? savedView
              : 'pharmacy-choice'
          );
        } else if (result.httpStatus === 401) {
          localStorage.removeItem('medistock_customer_token');
          localStorage.removeItem('medistock_customer_user');
          setCustomerUser(null);
          setCurrentView('customer-login');
        }

        return;
      }

      if (appMode === 'pharmacy') {
        const savedToken = localStorage.getItem('medistock_token');

        if (!savedToken) return;

        const result = await apiService.verifyPharmacyToken(savedToken);

        if (!active) return;

        if (result.success && result.user?.role === 'pharmacy_staff') {
          localStorage.setItem(
            'medistock_user',
            JSON.stringify(result.user)
          );
          setIsLoggedIn(true);
          setToken(savedToken);
          setCurrentView('admin-dashboard');
        } else if (result.httpStatus === 401) {
          localStorage.removeItem('medistock_token');
          localStorage.removeItem('medistock_user');
          setIsLoggedIn(false);
          setToken(null);
          setCurrentView('admin-login');
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [appMode]);

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
  const [cartPharmacyId, setCartPharmacyId] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Pengantaran');
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [appDialog, setAppDialog] = useState(null);
  const showNotice = (message, type = 'error', title) => setAppDialog({ type, title, message: String(message || '') });
  const askConfirmation = (message, title) => new Promise((resolve) => setAppDialog({ type: 'confirm', title, message, resolve }));
  const closeAppDialog = (confirmed = false) => {
    appDialog?.resolve?.(confirmed);
    setAppDialog(null);
  };

  // Inventory Editing Draft State
  const [inventoryDraft, setInventoryDraft] = useState([]);
  const [savingInventory, setSavingInventory] = useState(false);
  const [deletingMedicineId, setDeletingMedicineId] = useState(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const pharmacyUser = (() => {
    try { return JSON.parse(localStorage.getItem('medistock_user') || 'null'); } catch { return null; }
  })();
  const canManageInventory = isLoggedIn && pharmacyUser?.role === 'pharmacy_staff';

  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const resolvedTheme = theme === 'system'
        ? systemTheme.matches ? 'dark' : 'light'
        : theme;
      root.dataset.theme = resolvedTheme;
      root.style.colorScheme = resolvedTheme;
    };
    applyTheme();
    localStorage.setItem('medistock_theme', theme);
    systemTheme.addEventListener('change', applyTheme);
    return () => systemTheme.removeEventListener('change', applyTheme);
  }, [theme]);

  // Data Fetching Handlers
  const fetchPharmacies = useCallback(async () => {
    setLoadingPharmacies(true);
    setErrorPharmacies('');
    const result = await apiService.getPharmacies();
    if (result?.success && Array.isArray(result.data)) {
      setPharmacies(result.data);
      setSelectedPharmacyId((currentId) => {
        if (result.data.some((pharmacy) => pharmacy.id === currentId)) return currentId;
        return appMode === 'customer' ? '' : result.data[0]?.id || '';
      });
    } else {
      setErrorPharmacies(result?.message || 'Gagal memuat daftar apotek.');
    }
    setLoadingPharmacies(false);
  }, [appMode]);

  const fetchPharmacyInfo = useCallback(async (accessToken = null) => {
    if (!selectedPharmacyId || (appMode === 'customer' && ['customer-login', 'pharmacy-choice'].includes(currentViewRef.current))) {
      setLoadingPharmacyInfo(false);
      return;
    }
    setLoadingPharmacyInfo(true);
    setErrorPharmacyInfo(null);
    const pharmacyToken = accessToken || ((appMode === 'pharmacy' || currentViewRef.current === 'admin-dashboard') ? token : null);
    const pInfo = await apiService.getPharmacyInfo(selectedPharmacyId, pharmacyToken);
    if (pInfo && pInfo.success) {
      setIsStoreOpen(pInfo.data.isOpen);
      setPharmacies((current) => current.map((pharmacy) => pharmacy.id === pInfo.data.id ? { ...pharmacy, name: pInfo.data.name, isOpen: pInfo.data.isOpen } : pharmacy));
    } else {
      setErrorPharmacyInfo(pInfo?.message || 'Gagal memuat informasi apotek.');
    }
    setLoadingPharmacyInfo(false);
  }, [appMode, selectedPharmacyId, token]);

  const fetchMedicines = useCallback(async (query = '', accessToken = null) => {
  if (!selectedPharmacyId || (appMode === 'customer' && ['customer-login', 'pharmacy-choice'].includes(currentViewRef.current))) {
    setMedicines([]);
    setLoadingMedicines(false);
    setErrorMedicines(null);
    return;
  }
  if (!hasLoadedMedicines.current) {
    setLoadingMedicines(true);
  }

  setErrorMedicines(null);

  const pharmacyToken = accessToken || ((appMode === 'pharmacy' || currentViewRef.current === 'admin-dashboard') ? token : null);
  const medRes = await apiService.getMedicines(query, selectedPharmacyId, pharmacyToken);

  if (medRes && medRes.success) {
    setMedicines(
      medRes.data.map((medicine) => ({
        ...medicine,
        stock: getDisplayStock(medicine.stock),
      }))
    );

    hasLoadedMedicines.current = true;
  } else {
    setErrorMedicines(
      medRes?.message || 'Gagal memuat katalog obat dari server.'
    );
  }

  setLoadingMedicines(false);
}, [appMode, selectedPharmacyId, token]);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  useEffect(() => {
    if (selectedPharmacyId) localStorage.setItem('medistock_selected_pharmacy', selectedPharmacyId);
    else if (appMode === 'customer') localStorage.removeItem('medistock_selected_pharmacy');
  }, [appMode, selectedPharmacyId]);

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

  useEffect(() => {
    if (currentView !== 'admin-dashboard' || !canManageInventory) return undefined;
    let active = true;
    const refreshOrders = async () => {
      const result = await apiService.getOrders();
      if (!active) return;
      if (result?.success) setOrders(result.data);
      else setErrorOrders(result?.message || 'Gagal memuat data pesanan dari server.');
    };
    const intervalId = window.setInterval(refreshOrders, 10000);
    window.addEventListener('focus', refreshOrders);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshOrders);
    };
  }, [currentView, canManageInventory]);

  // Initial mount data load
  useEffect(() => {
    let isActive = true;
    const minimumSplashDuration = new Promise((resolve) => window.setTimeout(resolve, 5000));
    const loadInitialData = async () => {
      if (appMode === 'customer' && (!selectedPharmacyId || ['customer-login', 'pharmacy-choice'].includes(currentView))) {
        if (isActive) setShowSplash(false);
        return;
      }
      await Promise.all([fetchPharmacyInfo(), fetchMedicines()]);
      await minimumSplashDuration;
      if (isActive) setShowSplash(false);
    };
    loadInitialData();
    return () => { isActive = false; };
  }, [appMode, currentView, fetchPharmacyInfo, fetchMedicines, selectedPharmacyId]);

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
    if (!selectedPharmacyId || !pharmacies.some((pharmacy) => pharmacy.id === selectedPharmacyId)) {
      showNotice('Pilih apotek aktif sebelum menambahkan obat ke keranjang.', 'warning', 'Pilih apotek');
      return;
    }
    if (cartPharmacyId && cartPharmacyId !== selectedPharmacyId) {
      showNotice('Keranjang hanya dapat berisi obat dari satu apotek.', 'warning', 'Apotek berubah');
      return;
    }
    if (!isStoreOpen) {
      showNotice('Mohon maaf, toko sedang tutup saat ini.');
      return;
    }
    const availableStock = getDisplayStock(med.stock);
    if (availableStock === 0) return;
    const existingCartItem = cart.find((item) => item.id === med.id);
    if (existingCartItem && existingCartItem.qty >= availableStock) {
      showNotice(`Stok tersedia hanya ${availableStock}.`, 'warning', 'Stok terbatas');
      return;
    }

    setCurrentOrder(null);
    setShowSuccessModal(false);
    setCartPharmacyId(selectedPharmacyId);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === med.id);
      if (existing) return prev.map((item) => (item.id === med.id ? { ...item, qty: item.qty + 1 } : item));
      return [...prev, { ...med, stock: availableStock, qty: 1 }];
    });
  };

  const updateCartQty = (medId, delta) => {
    if (cartPharmacyId && cartPharmacyId !== selectedPharmacyId) {
      showNotice('Pilih kembali apotek asal keranjang sebelum mengubah pesanan.', 'warning', 'Apotek berubah');
      return;
    }
    const medicine = medicines.find((item) => item.id === medId);
    const currentItem = cart.find((item) => item.id === medId);
    const availableStock = medicine ? getDisplayStock(medicine.stock) : 0;
    if (!currentItem || delta === 0) return;
    if (delta > 0 && medicine && currentItem.qty + delta > availableStock) {
      showNotice(`Stok tersedia hanya ${availableStock}.`, 'warning', 'Stok terbatas');
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
    if (!selectedPharmacyId || cartPharmacyId !== selectedPharmacyId || !pharmacies.some((pharmacy) => pharmacy.id === selectedPharmacyId)) {
      showNotice('Pilih apotek tujuan dan tambahkan kembali obat dari katalog apotek tersebut.', 'warning', 'Apotek belum dipilih');
      setCart([]);
      setCartPharmacyId('');
      setCurrentView('pharmacy-choice');
      return;
    }
    if (!customerUser) {
      setCurrentView('customer-login');
      return;
    }
    const unavailable = cart.find((item) => {
      const medicine = medicines.find((candidate) => candidate.id === item.id);
      return !medicine || item.qty > getDisplayStock(medicine.stock);
    });
    if (unavailable) {
      const medicine = medicines.find((candidate) => candidate.id === unavailable.id);
      showNotice(medicine ? `Stok ${medicine.name} tersedia hanya ${getDisplayStock(medicine.stock)}.` : 'Obat tidak lagi tersedia. Katalog akan diperbarui.', 'warning', 'Stok berubah');
      fetchMedicines();
      return;
    }
    setCurrentView('checkout');
  };

  const handlePayViaQRIS = async (e) => {
    e.preventDefault();
    if (currentOrder?.paymentStatus === 'Menunggu Pembayaran') {
      setCurrentView('qris');
      return;
    }
    if (!selectedPharmacyId
      || cartPharmacyId !== selectedPharmacyId
      || !pharmacies.some((pharmacy) => pharmacy.id === selectedPharmacyId)
      || cart.some((item) => !medicines.some((medicine) => medicine.id === item.id))) {
      showNotice('Apotek atau katalog berubah. Pilih apotek kembali lalu susun ulang keranjang.', 'warning', 'Periksa apotek tujuan');
      setCart([]);
      setCartPharmacyId('');
      setCurrentView('pharmacy-choice');
      return;
    }
    if (!customerInfo.name || !customerInfo.phone) {
      showNotice('Mohon lengkapi Nama dan Nomor Telepon.', 'warning', 'Data belum lengkap');
      return;
    }
    if (deliveryMethod === 'Pengantaran' && !customerInfo.address) {
      showNotice('Mohon lengkapi Alamat Pengantaran.', 'warning', 'Data belum lengkap');
      return;
    }

    const orderPayload = {
      pharmacyId: selectedPharmacyId,
      customerName: customerInfo.name,
      phone: customerInfo.phone,
      address: deliveryMethod === 'Pengantaran' ? customerInfo.address : '-',
      deliveryType: deliveryMethod,
      paymentMethod,
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
        setCurrentView(paymentMethod === 'Tunai di Apotek' ? 'cash-order' : 'qris');
      } else {
        showNotice(res?.message || 'Gagal membuat pesanan di server. Silakan coba lagi.');
        fetchMedicines();
      }
    } finally { setSubmittingOrder(false); }
  };

  const handlePaymentVerified = () => {
    setCurrentOrder((order) => order ? { ...order, paymentStatus: 'Lunas (QRIS)', orderStatus: 'Menunggu Konfirmasi' } : order);
    setShowSuccessModal(true);
    setCart([]);
    fetchOrders();
    fetchMedicines();
  };

  const handleBackToCheckout = () => {
    if (currentOrder?.paymentStatus === 'Menunggu Pembayaran') {
      setCustomerInfo({
        name: currentOrder.customerName || '',
        phone: currentOrder.phone || '',
        address: currentOrder.address === '-' ? '' : currentOrder.address || ''
      });
    }
    setCurrentView('checkout');
  };

  const handleCustomerReview = async (orderId, rating, comment) => {
    const result = await apiService.submitOrderReview(orderId, rating, comment);
    if (result?.success) fetchOrders();
    return result;
  };

  const resetCustomerFlow = () => {
    setCart([]);
    setCartPharmacyId('');
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
      fetchPharmacyInfo(res.token);
      fetchMedicines('', res.token);
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
      localStorage.removeItem('medistock_selected_pharmacy');
      setCustomerUser(result.user);
      setSelectedPharmacyId('');
      setCart([]);
      setCartPharmacyId('');
      setCurrentOrder(null);
      setShowSuccessModal(false);
      setMedicines([]);
      hasLoadedMedicines.current = false;
      setCurrentView('pharmacy-choice');
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
  localStorage.removeItem('medistock_selected_pharmacy');
  sessionStorage.removeItem('medistock_customer_view');

  setCustomerUser(null);
  setSelectedPharmacyId('');
  setCart([]);
  setCartPharmacyId('');
  setCurrentOrder(null);
  setShowSuccessModal(false);
  setMedicines([]);
  hasLoadedMedicines.current = false;
  setCurrentView('customer-login');
};

  const handleOpenCustomerHistory = () => {
    if (customerUser) {
      setCurrentView('customer-history');
      return;
    }
    setCurrentView('customer-login');
  };

  const handleResumePayment = (order) => {
    setCurrentOrder(order);
    setShowSuccessModal(false);
    setCurrentView('qris');
  };

  const handleOpenCustomerLogin = () => {
    setCurrentView('customer-login');
  };

  const handleOpenPharmacySelection = () => setCurrentView('pharmacy-choice');

  const handleToggleStoreOpen = async (newStatus) => {
    setIsStoreOpen(newStatus);
    const res = await apiService.toggleStoreStatus(newStatus, token);
    if (res && res.success) {
      fetchPharmacyInfo();
    } else {
      showNotice(res?.message || 'Gagal mengubah status apotek.');
      fetchPharmacyInfo();
    }
  };

  const handleSelectPharmacy = (pharmacyId) => {
    const pharmacy = pharmacies.find((item) => item.id === pharmacyId);
    if (!pharmacy) {
      showNotice('Apotek tidak tersedia atau sedang nonaktif. Pilih apotek lain.', 'warning', 'Apotek tidak tersedia');
      return;
    }
    if (pharmacyId !== selectedPharmacyId) {
      setSelectedPharmacyId(pharmacyId);
      setCart([]);
      setCartPharmacyId('');
      setCurrentOrder(null);
      setShowSuccessModal(false);
      setMedicines([]);
      hasLoadedMedicines.current = false;
      setIsStoreOpen(Boolean(pharmacy.isOpen));
    }
    if (currentViewRef.current === 'pharmacy-choice') setCurrentView('customer');
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, options = {}) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await apiService.updateOrderStatus(orderId, newStatus, options, token);
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
        showNotice('Sesi apotek sudah berakhir. Silakan login kembali sebelum memperbarui pesanan.', 'warning', 'Sesi berakhir');
      } else showNotice(res?.message || 'Gagal memperbarui status pesanan.');
    } finally { setUpdatingOrderId(null); }
  };

  const handleVerifyCustomerPayment = async (orderId) => {
    if (!await askConfirmation('Pastikan pembayaran QRIS benar-benar sudah diterima sebelum menandainya sebagai terverifikasi.', 'Verifikasi pembayaran')) return;
    setUpdatingOrderId(orderId);
    try {
      const result = await apiService.verifyCustomerPayment(orderId, token);
      if (result?.success) {
        await Promise.all([fetchOrders(), fetchMedicines()]);
      } else {
        showNotice(result?.message || 'Gagal memverifikasi pembayaran.');
      }
    } finally {
      setUpdatingOrderId(null);
    }
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
      showNotice('Akun ini tidak memiliki akses ke dashboard apotek.', 'warning', 'Akses ditolak');
      setCurrentView('admin-login');
    }
    else if (result?.httpStatus === 401) {
      localStorage.removeItem('medistock_token');
      localStorage.removeItem('medistock_user');
      setIsLoggedIn(false);
      setToken(null);
      setCurrentView('admin-login');
    } else showNotice(result?.message || 'Sesi apotek belum dapat diverifikasi. Coba lagi.');
  };

  const handleSaveInventory = async (items = inventoryDraft) => {
    if (!canManageInventory || savingInventory) return;
    if (!items.every((item) => isValidStockInput(item.stock))) {
      showNotice(STOCK_VALIDATION_MESSAGE, 'warning', 'Stok tidak valid');
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
        showNotice('Perubahan inventaris berhasil disimpan!', 'success');
        return true;
      }
      showNotice(res?.message || 'Gagal memperbarui inventaris.');
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
    if (!canManageInventory || !await askConfirmation('Apakah Anda yakin ingin menghapus obat ini?', 'Hapus obat')) return false;
    setDeletingMedicineId(medicine.id);
    try {
      const res = await apiService.deleteMedicine(medicine.id, token);
      if (res?.success) {
        await fetchMedicines();
        return true;
      }
      showNotice(res?.message || 'Gagal menghapus obat.');
      return false;
    } finally { setDeletingMedicineId(null); }
  };

  const handleResetOrders = async (scope) => {
    if (!canManageInventory || !['all', 'completed'].includes(scope)) return false;
    const affectedCount = scope === 'completed'
      ? orders.filter((order) => order.orderStatus === 'Selesai').length
      : orders.length;
    const label = scope === 'completed' ? 'transaksi selesai pada laporan' : 'seluruh pesanan masuk';
    const confirmed = await askConfirmation(
      `Anda akan menghapus ${affectedCount} ${label}. Data yang dihapus tidak dapat dipulihkan dan riwayat pelanggan terkait juga akan hilang. Lanjutkan?`,
      'Konfirmasi reset data'
    );
    if (!confirmed) return false;

    const result = await apiService.resetOrders(scope, token);
    if (!result?.success) {
      showNotice(result?.message || 'Gagal mereset data pesanan.');
      return false;
    }
    await fetchOrders();
    showNotice(result.message || 'Data berhasil direset.', 'success', 'Reset berhasil');
    return true;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen selection:bg-primary selection:text-white font-sans bg-slate-50 text-navy">
      {showSplash && <SplashScreen />}
      
{/* Top Demo Route Switcher Bar */}

{appMode === 'demo' && (
  <DemoBanner
    currentView={currentView}
    setCurrentView={setCurrentView}
    isLoggedIn={isLoggedIn}
    onOpenPharmacy={handleOpenPharmacy}
    onCustomerLogin={handleOpenCustomerLogin}
    theme={theme}
    onThemeChange={setTheme}
    hideTheme={currentView === 'pharmacy-choice'}
  />
)}

      {/* Main Container */}
      <main className="flex-1 flex flex-col bg-slate-50">
        {currentView === 'pharmacy-choice' && <PharmacySelectionView
          pharmacies={pharmacies}
          selectedPharmacyId={selectedPharmacyId}
          loading={loadingPharmacies}
          error={errorPharmacies}
          onRetry={fetchPharmacies}
          onSelect={handleSelectPharmacy}
          customerUser={customerUser}
          onLogout={handleCustomerLogout}
          theme={theme}
          onThemeChange={setTheme}
        />}

        {currentView === 'customer' && (
          <CustomerHomeView
            medicines={medicines}
            onChangePharmacy={handleOpenPharmacySelection}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            cart={cart}
            addToCart={addToCart}
            updateCartQty={updateCartQty}
            cartTotal={cartTotal}
            hasPlacedOrder={Boolean(currentOrder)}
            isStoreOpen={isStoreOpen}
            pharmacyName={pharmacies.find((pharmacy) => pharmacy.id === selectedPharmacyId)?.name || 'Apotek'}
            onProceedToCheckout={handleProceedToCheckout}
            loadingMedicines={loadingMedicines}
            errorMedicines={errorMedicines}
            onRetryMedicines={() => fetchMedicines(searchQuery)}
            onOpenHistory={handleOpenCustomerHistory}
            onCustomerLogin={handleOpenCustomerLogin}
            customerUser={customerUser}
            onCustomerLogout={handleCustomerLogout}
            theme={theme}
            onThemeChange={!showSplash ? setTheme : undefined}
          />
        )}

        {currentView === 'customer-login' && (
          <CustomerAuthView onLogin={handleCustomerLogin} onRegister={handleCustomerRegister} />
        )}

        {currentView === 'customer-history' && customerUser && <CustomerHistoryView onLoadOrders={apiService.getCustomerOrders} onCompleteDelivery={handleCustomerCompleteDelivery} onSubmitReview={handleCustomerReview} onResumePayment={handleResumePayment} askConfirmation={askConfirmation} onBack={() => setCurrentView('customer')} />}

        {currentView === 'checkout' && (
          <CheckoutView
            cart={cart}
            updateCartQty={updateCartQty}
            deliveryMethod={deliveryMethod}
            setDeliveryMethod={setDeliveryMethod}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
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
            onCheckPaymentStatus={apiService.getCustomerPaymentStatus}
            onConfirmPayment={apiService.confirmPayment}
            onPaymentVerified={handlePaymentVerified}
            onBackToCheckout={handleBackToCheckout}
            showSuccessModal={showSuccessModal}
            onReset={resetCustomerFlow}
            onOpenHistory={handleOpenCustomerHistory}
          />
        )}

        {currentView === 'cash-order' && currentOrder && <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <div className="w-full rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</div>
            <h1 className="text-xl font-bold text-slate-900">Pesanan berhasil dibuat</h1>
            <p className="mt-2 text-sm text-slate-600">Siapkan pembayaran <strong>{formatIDR(currentOrder.totalAmount)}</strong> secara tunai saat mengambil pesanan di apotek.</p>
            <p className="mt-5 rounded-lg bg-slate-50 p-3 font-mono text-lg font-bold text-primary">{currentOrder.displayOrderNumber || currentOrder.id}</p>
            <p className="mt-2 text-xs text-slate-500">Simpan ID pesanan ini dan tunjukkan kepada petugas saat mengambil obat.</p>
            <button type="button" onClick={resetCustomerFlow} className="mt-6 w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white">Selesai</button>
          </div>
        </main>}

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
            onVerifyCustomerPayment={handleVerifyCustomerPayment}
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
            askConfirmation={askConfirmation}
            onResetOrders={handleResetOrders}
            canManageInventory={canManageInventory}
            savingInventory={savingInventory}
            deletingMedicineId={deletingMedicineId}
            updatingOrderId={updatingOrderId}
            theme={theme}
            onThemeChange={!showSplash ? setTheme : undefined}
          />
        )}
      </main>

      {/* Footer */}
      {currentView !== 'qris' && <Footer />}
      <AppDialog dialog={appDialog} onClose={closeAppDialog} />
    </div>
  );
}

export default function App() {
  const appMode = import.meta.env.VITE_APP_MODE || 'demo';
  if (appMode === 'platform-admin') return <PlatformAdminPortal />;
  return <MainApplication />;
}
