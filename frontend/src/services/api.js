const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE_URL = RAW_BASE_URL.endsWith('/') ? RAW_BASE_URL.slice(0, -1) : RAW_BASE_URL;

const getHeaders = (customToken = null, tokenStorageKey = 'medistock_token') => {
  const headers = { 'Content-Type': 'application/json' };
  const token = customToken !== null ? customToken : localStorage.getItem(tokenStorageKey);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const getCustomerHeaders = () => getHeaders(null, 'medistock_customer_token');

const normalizePharmacyProfile = (pharmacy) => ({
  ...pharmacy,
  address: pharmacy.address ?? null,
  maps_url: pharmacy.maps_url ?? null,
  image_url: pharmacy.image_url ?? null
});

const normalizePharmacyResult = (result) => {
  if (Array.isArray(result?.data)) {
    return { ...result, data: result.data.map(normalizePharmacyProfile) };
  }
  if (result?.data && typeof result.data === 'object') {
    const data = { ...result.data };
    if (data.pharmacy) data.pharmacy = normalizePharmacyProfile(data.pharmacy);
    else Object.assign(data, normalizePharmacyProfile(data));
    return { ...result, data };
  }
  return result;
};

const normalizePharmacyPayload = (payload) => {
  const normalized = { ...payload };
  for (const field of ['address', 'maps_url', 'image_url']) {
    if (!Object.hasOwn(payload, field)) continue;
    const value = payload[field];
    normalized[field] = typeof value === 'string' && value.trim() ? value.trim() : null;
  }
  return normalized;
};

export const apiService = {
  // Pharmacy info & status
  async getPharmacies() {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/list`);
      return normalizePharmacyResult(await res.json());
    } catch (err) {
      console.error('API Error getPharmacies:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async getPharmacyInfo(pharmacyId = '', token = null) {
    try {
      const query = pharmacyId ? `?pharmacyId=${encodeURIComponent(pharmacyId)}` : '';
      const res = await fetch(`${API_BASE_URL}/pharmacy/info${query}`, { headers: token ? getHeaders(token) : { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      return normalizePharmacyResult(await res.json());
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
  async getMedicines(search = '', pharmacyId = '', token = null) {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (pharmacyId) params.set('pharmacyId', pharmacyId);
      const url = `${API_BASE_URL}/medicines${params.size ? `?${params}` : ''}`;
      const res = await fetch(url, { headers: token ? getHeaders(token) : { 'Content-Type': 'application/json' } });
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

  async createMedicine(medicine, token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/medicines`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(medicine)
      });
      return await res.json();
    } catch (err) {
      console.error('API Error createMedicine:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async deleteMedicine(id, token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/medicines/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getHeaders(token)
      });
      return await res.json();
    } catch (err) {
      console.error('API Error deleteMedicine:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  // Orders
  async getOrders() {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, { headers: getHeaders() });
      const result = await res.json();
      if (!res.ok) {
        return {
          ...result,
          success: false,
          message: result?.message || `Gagal memuat pesanan (HTTP ${res.status}).`
        };
      }
      return result;
    } catch (err) {
      console.error('API Error getOrders:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async resetOrders(scope, token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/reset`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify({ scope, confirm: 'RESET_ORDERS' })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error resetOrders:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async getCustomerOrders() {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/customer/history`, {
        headers: getCustomerHeaders()
      });
      return await res.json();
    } catch (err) {
      console.error('API Error getCustomerOrders:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async getCustomerPaymentStatus(orderId) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/payment-status`, {
        headers: getCustomerHeaders()
      });
      return await res.json();
    } catch (err) {
      console.error('API Error getCustomerPaymentStatus:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async confirmPayment(orderId) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/confirm-payment`, {
        method: 'POST',
        headers: getCustomerHeaders()
      });
      return await res.json();
    } catch (err) {
      console.error('API Error confirmPayment:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async verifyCustomerPayment(orderId, token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/verify-payment`, {
        method: 'POST',
        headers: getHeaders(token)
      });
      return await res.json();
    } catch (err) {
      console.error('API Error verifyCustomerPayment:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async trackOrder(orderId, phone) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/tracking?phone=${encodeURIComponent(phone)}`);
      return await res.json();
    } catch (err) {
      console.error('API Error trackOrder:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async completeDeliveryOrder(orderId) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/customer-complete`, {
        method: 'POST',
        headers: getCustomerHeaders(),
      });
      return await res.json();
    } catch (err) {
      console.error('API Error completeDeliveryOrder:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async createOrder(orderData) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify(orderData)
      });
      return await res.json();
    } catch (err) {
      console.error('API Error createOrder:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async submitOrderReview(orderId, rating, comment) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/review`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify({ rating, comment })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error submitOrderReview:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async updateOrderStatus(orderId, orderStatus, options = {}, token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        headers: getHeaders(token),
        body: JSON.stringify({ orderStatus, ...options })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error updateOrderStatus:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  // Pharmacy Authentication
  async loginPharmacy(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error loginPharmacy:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async loginPlatformAdmin(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/platform-admin/login`, {
        method: 'POST',
        headers: getHeaders(''),
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error loginPlatformAdmin:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async verifyPlatformAdminToken(token) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify`, { headers: getHeaders(token) });
      const result = await res.json();
      return { ...result, httpStatus: res.status };
    } catch (err) {
      console.error('API Error verifyPlatformAdminToken:', err);
      return { success: false, httpStatus: 0, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async getPlatformAdminPharmacies(token) {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/admin`, { headers: getHeaders(token) });
      const result = await res.json();
      return { ...normalizePharmacyResult(result), httpStatus: res.status };
    } catch (err) {
      console.error('API Error getPlatformAdminPharmacies:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async getPlatformAdminPharmacy(id, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/admin/${encodeURIComponent(id)}`, { headers: getHeaders(token) });
      const result = await res.json();
      return { ...normalizePharmacyResult(result), httpStatus: res.status };
    } catch (err) {
      console.error('API Error getPlatformAdminPharmacy:', err);
      return { success: false, httpStatus: 0, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async updatePlatformAdminPharmacy(id, data, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/admin/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: getHeaders(token), body: JSON.stringify(normalizePharmacyPayload(data))
      });
      const result = await res.json();
      return { ...normalizePharmacyResult(result), httpStatus: res.status };
    } catch (err) {
      console.error('API Error updatePlatformAdminPharmacy:', err);
      return { success: false, httpStatus: 0, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async setPlatformAdminPharmacyActive(id, isActive, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/admin/${encodeURIComponent(id)}/status`, {
        method: 'PATCH', headers: getHeaders(token), body: JSON.stringify({ isActive })
      });
      const result = await res.json();
      return { ...result, httpStatus: res.status };
    } catch (err) {
      console.error('API Error setPlatformAdminPharmacyActive:', err);
      return { success: false, httpStatus: 0, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async updatePlatformAdminStaff(pharmacyId, staffId, data, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/admin/${encodeURIComponent(pharmacyId)}/staff/${encodeURIComponent(staffId)}`, {
        method: 'PATCH', headers: getHeaders(token), body: JSON.stringify(data)
      });
      const result = await res.json();
      return { ...result, httpStatus: res.status };
    } catch (err) {
      console.error('API Error updatePlatformAdminStaff:', err);
      return { success: false, httpStatus: 0, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async resetPlatformAdminStaffPassword(pharmacyId, staffId, password, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/admin/${encodeURIComponent(pharmacyId)}/staff/${encodeURIComponent(staffId)}/reset-password`, {
        method: 'POST', headers: getHeaders(token), body: JSON.stringify({ password })
      });
      const result = await res.json();
      return { ...result, httpStatus: res.status };
    } catch (err) {
      console.error('API Error resetPlatformAdminStaffPassword:', err);
      return { success: false, httpStatus: 0, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async deletePlatformAdminPharmacy(id, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/admin/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getHeaders(token) });
      if (res.status === 204) return { success: true, httpStatus: res.status };
      const result = await res.json();
      return { ...result, httpStatus: res.status };
    } catch (err) {
      console.error('API Error deletePlatformAdminPharmacy:', err);
      return { success: false, httpStatus: 0, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async createPharmacyWithStaff(payload, token) {
    try {
      const res = await fetch(`${API_BASE_URL}/pharmacy/admin`, {
        method: 'POST',
        headers: getHeaders(token),
        body: JSON.stringify(normalizePharmacyPayload(payload))
      });
      const result = await res.json();
      return { ...normalizePharmacyResult(result), httpStatus: res.status };
    } catch (err) {
      console.error('API Error createPharmacyWithStaff:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async loginCustomer(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/customer/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error loginCustomer:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

  async registerCustomer(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/customer/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password })
      });
      return await res.json();
    } catch (err) {
      console.error('API Error registerCustomer:', err);
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  },

   
 
  async verifyCustomerToken(token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: token
          ? getHeaders(token)
          : getCustomerHeaders()
      });
      const result = await res.json();
      return { ...result, httpStatus: res.status };
    } catch (err) {
      console.error('API Error verifyCustomerToken:', err);
      return {
        success: false,
        httpStatus: 0,
        message: 'Server backend tidak dapat dihubungi.'
      };
    }
  },

  async verifyPharmacyToken(token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: getHeaders(token)
      });
      const result = await res.json();
      return { ...result, httpStatus: res.status };
    } catch (err) {
      console.error('API Error verifyPharmacyToken:', err);
      return {
        success: false,
        httpStatus: 0,
        message: 'Server backend tidak dapat dihubungi.'
      };
    }
  },
};
