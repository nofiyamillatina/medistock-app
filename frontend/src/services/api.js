const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

const getHeaders = (customToken = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = customToken || localStorage.getItem('medistock_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiService = {
  // Pharmacy info & status
  async getPharmacyInfo() {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/info`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Error getPharmacyInfo:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async toggleStoreStatus(isOpen, token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/status`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ isOpen })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error toggleStoreStatus:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  // Medicines Catalog & Inventory
  async getMedicines(search = '') {
    try {
      const url = search ? `${API_BASE_URL}/medicines?search=${encodeURIComponent(search)}` : `${API_BASE_URL}/medicines`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Error getMedicines:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async saveInventory(items, token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/medicines/inventory`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ items })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error saveInventory:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  // Orders
  async getOrders() {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error('API Error getOrders:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async createOrder(orderData) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(orderData)
      });
      return await res.json();
    } catch (err) {
      console.error('API Error createOrder:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async confirmPayment(orderId) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        headers: getHeaders()
      });
      return await res.json();
    } catch (err) {
      console.error('API Error confirmPayment:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async updateOrderStatus(orderId, orderStatus, token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getHeaders(token),
        body: JSON.stringify({ orderStatus })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error updateOrderStatus:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  // Pharmacy Authentication
  async loginPharmacy(username, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ username, password })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error loginPharmacy:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  }
};

