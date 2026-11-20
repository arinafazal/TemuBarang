// Konfigurasi endpoint API
const isFile = window.location.protocol === 'file:';
const isLocal = isFile || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';
const API_BASE_URL = isLocal
  ? (window.location.port === '3000' ? '' : 'http://localhost:3000')
  : '';

// Helper Storage Cache untuk Mode Offline (Bulletproof LocalStorage Fallback)
const TB_CACHE = {
  get(key) {
    try {
      const item = localStorage.getItem(`tb_cache_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  },
  set(key, data) {
    try {
      localStorage.setItem(`tb_cache_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Gagal menyimpan cache offline:', e);
    }
  }
};

const API = {
  // Categories
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.data && data.data.length) {
        TB_CACHE.set('categories', data);
      }
      return data;
    } catch (err) {
      console.warn('[TemuBarang Offline] Mengambil kategori dari cache...', err);
      const cached = TB_CACHE.get('categories');
      if (cached && cached.data && cached.data.length) {
        return { ...cached, _isOffline: true };
      }
      throw err;
    }
  },

  // Lost Items
  async getLostItems(params = {}) {
    const query = new URLSearchParams(params).toString();
    const cacheKey = `lost_items_${query}`;
    try {
      const res = await fetch(`${API_BASE_URL}/api/lost-items${query ? '?' + query : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.data && data.data.length) {
        TB_CACHE.set(cacheKey, data);
        if (!query) TB_CACHE.set('lost_items_all', data);
      }
      return data;
    } catch (err) {
      console.warn('[TemuBarang Offline] Mengambil barang hilang dari cache...', err);
      const cached = TB_CACHE.get(cacheKey) || TB_CACHE.get('lost_items_all') || TB_CACHE.get('lost_items_');
      if (cached && cached.data && cached.data.length) {
        return { ...cached, _isOffline: true };
      }
      throw err;
    }
  },

  async getLostItemById(id) {
    const cacheKey = `lost_item_${id}`;
    try {
      const res = await fetch(`${API_BASE_URL}/api/lost-items/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.data) {
        TB_CACHE.set(cacheKey, data);
      }
      return data;
    } catch (err) {
      console.warn(`[TemuBarang Offline] Mengambil detail hilang #${id} dari cache...`, err);
      const cached = TB_CACHE.get(cacheKey);
      if (cached && cached.data) return { ...cached, _isOffline: true };

      // Fallback: Cari di cache daftar barang hilang yang pernah dimuat
      const allLost = TB_CACHE.get('lost_items_all') || TB_CACHE.get('lost_items_');
      if (allLost && Array.isArray(allLost.data)) {
        const found = allLost.data.find((item) => String(item.id) === String(id));
        if (found) {
          return { success: true, data: found, _isOffline: true };
        }
      }
      throw err;
    }
  },

  async createLostItem(data) {
    if (!navigator.onLine) {
      throw new Error('Anda sedang offline. Hubungkan kembali koneksi internet untuk mengirim laporan.');
    }
    const res = await fetch(`${API_BASE_URL}/api/lost-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateLostItem(id, data) {
    if (!navigator.onLine) {
      throw new Error('Anda sedang offline. Hubungkan kembali koneksi internet untuk memperbarui laporan.');
    }
    const res = await fetch(`${API_BASE_URL}/api/lost-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteLostItem(id) {
    if (!navigator.onLine) {
      throw new Error('Anda sedang offline. Hubungkan kembali koneksi internet untuk menghapus laporan.');
    }
    const res = await fetch(`${API_BASE_URL}/api/lost-items/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Found Items
  async getFoundItems(params = {}) {
    const query = new URLSearchParams(params).toString();
    const cacheKey = `found_items_${query}`;
    try {
      const res = await fetch(`${API_BASE_URL}/api/found-items${query ? '?' + query : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.data && data.data.length) {
        TB_CACHE.set(cacheKey, data);
        if (!query) TB_CACHE.set('found_items_all', data);
      }
      return data;
    } catch (err) {
      console.warn('[TemuBarang Offline] Mengambil barang temuan dari cache...', err);
      const cached = TB_CACHE.get(cacheKey) || TB_CACHE.get('found_items_all') || TB_CACHE.get('found_items_');
      if (cached && cached.data && cached.data.length) {
        return { ...cached, _isOffline: true };
      }
      throw err;
    }
  },

  async getFoundItemById(id) {
    const cacheKey = `found_item_${id}`;
    try {
      const res = await fetch(`${API_BASE_URL}/api/found-items/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.data) {
        TB_CACHE.set(cacheKey, data);
      }
      return data;
    } catch (err) {
      console.warn(`[TemuBarang Offline] Mengambil detail temuan #${id} dari cache...`, err);
      const cached = TB_CACHE.get(cacheKey);
      if (cached && cached.data) return { ...cached, _isOffline: true };

      // Fallback: Cari di cache daftar barang temuan yang pernah dimuat
      const allFound = TB_CACHE.get('found_items_all') || TB_CACHE.get('found_items_');
      if (allFound && Array.isArray(allFound.data)) {
        const found = allFound.data.find((item) => String(item.id) === String(id));
        if (found) {
          return { success: true, data: found, _isOffline: true };
        }
      }
      throw err;
    }
  },

  async createFoundItem(data) {
    if (!navigator.onLine) {
      throw new Error('Anda sedang offline. Hubungkan kembali koneksi internet untuk mengirim laporan.');
    }
    const res = await fetch(`${API_BASE_URL}/api/found-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateFoundItem(id, data) {
    if (!navigator.onLine) {
      throw new Error('Anda sedang offline. Hubungkan kembali koneksi internet untuk memperbarui laporan.');
    }
    const res = await fetch(`${API_BASE_URL}/api/found-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteFoundItem(id) {
    if (!navigator.onLine) {
      throw new Error('Anda sedang offline. Hubungkan kembali koneksi internet untuk menghapus laporan.');
    }
    const res = await fetch(`${API_BASE_URL}/api/found-items/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  }
};
