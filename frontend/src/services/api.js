const API_BASE_URL = 'http://localhost:5000/api';

const getHeaders = (token = null) => {
  const headers = { 'Content-Type': 'application/json' };
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
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable, falling back to local state:', err);
      return null;
    }
  },

  async toggleStoreStatus(isOpen, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/status`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ isOpen })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error toggleStoreStatus:', err);
      return { success: false };
    }
  },

  // Medicines Catalog & Inventory
  async getMedicines(search = '') {
    try {
      const url = search ? `${API_BASE_URL}/medicines?search=${encodeURIComponent(search)}` : `${API_BASE_URL}/medicines`;
      const res = await fetch(url);
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable for medicines:', err);
      return null;
    }
  },

  async saveInventory(items, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/medicines/inventory`, {
        method: 'PUT',
        headers: getHeaders(token),
        body: JSON.stringify({ items })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error saveInventory:', err);
      return { success: false };
    }
  },

  // Orders
  async getOrders() {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`);
      return await res.json();
    } catch (err) {
      console.warn('Backend unavailable for orders:', err);
      return null;
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
      return { success: false };
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
      return { success: false };
    }
  },

  async updateOrderStatus(orderId, orderStatus, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getHeaders(token),
        body: JSON.stringify({ orderStatus })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error updateOrderStatus:', err);
      return { success: false };
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
