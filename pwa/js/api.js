// ==========================================================================
// 1. Konfigurasi endpoint API
// ==========================================================================
const isFile = window.location.protocol === 'file:';
const isLocal = isFile || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';
const API_BASE_URL = isLocal
  ? (window.location.port === '3000' ? '' : 'http://localhost:3000')
  : '';

// ==========================================================================
// 2. Query Caching (Sesuai Modul 5: In-Memory Map + LocalStorage Disk Storage + TTL)
// Data di-cache selama TTL, kunjungan kedua diambil langsung dari disk/memory.
// Di DevTools Network tab juga didukung Cache-Control HTTP disk cache.
// ==========================================================================
const MEMORY_CACHE = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Jam TTL

function getCached(key) {
  // 1. Cek memory cache (paling cepat)
  const mem = MEMORY_CACHE.get(key);
  if (mem) {
    if (Date.now() - mem.timestamp <= CACHE_TTL) {
      return mem.data;
    }
    MEMORY_CACHE.delete(key);
  }

  // 2. Cek localStorage (disk cache — bertahan meski browser di-refresh)
  try {
    const raw = localStorage.getItem(`qcache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.timestamp <= CACHE_TTL) {
        MEMORY_CACHE.set(key, parsed); // naikan ke memory
        return parsed.data;
      }
      localStorage.removeItem(`qcache_${key}`);
    }
  } catch (e) {
    console.warn('Gagal membaca cache lokal:', e);
  }

  return null;
}

function setCached(key, data) {
  const entry = { data, timestamp: Date.now() };
  MEMORY_CACHE.set(key, entry);
  try {
    localStorage.setItem(`qcache_${key}`, JSON.stringify(entry));
  } catch (e) {
    console.warn('Gagal menyimpan cache lokal:', e);
  }
}

function invalidateCache(key) {
  MEMORY_CACHE.delete(key);
  try {
    localStorage.removeItem(`qcache_${key}`);
  } catch (e) {
    console.warn('Gagal menghapus cache lokal:', e);
  }
}

function invalidateCacheByPrefix(prefix) {
  for (const k of MEMORY_CACHE.keys()) {
    if (k.startsWith(prefix)) MEMORY_CACHE.delete(k);
  }
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`qcache_${prefix}`)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Gagal membersihkan cache lokal:', e);
  }
}

// Expose Query Cache Utility
window.TB_QUERY_CACHE = {
  getCached,
  setCached,
  invalidateCache,
  invalidateCacheByPrefix
};

// ==========================================================================
// 3. Soft Delete / Arsip (Sesuai Modul 5 archiveStorage.js via localStorage)
// Guaranteed to work across all backend schemas without DB column dependencies.
// ==========================================================================
const ARCHIVE_KEY = 'temubarang_archived_items';

const TB_ARCHIVE = {
  getArchivedItems() {
    try {
      const raw = localStorage.getItem(ARCHIVE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Gagal membaca arsip lokal:', e);
      return [];
    }
  },

  isItemArchived(itemId, type) {
    if (!itemId) return false;
    const list = this.getArchivedItems();
    return list.some((item) => String(item.id) === String(itemId) && (!type || item._archiveType === type));
  },

  archiveItemLocally(item, type = 'temuan') {
    if (!item || !item.id) return false;
    try {
      const list = this.getArchivedItems();
      if (!list.some((it) => String(it.id) === String(item.id) && it._archiveType === type)) {
        const archivedItem = {
          ...item,
          _archiveType: type,
          archivedAt: new Date().toISOString()
        };
        list.unshift(archivedItem);
        localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list));
      }
      return true;
    } catch (e) {
      console.warn('Gagal mengarsipkan laporan di perangkat ini:', e);
      return false;
    }
  },

  restoreItemLocally(itemId, type = 'temuan') {
    if (!itemId) return false;
    try {
      const list = this.getArchivedItems();
      const next = list.filter((item) => !(String(item.id) === String(itemId) && (!type || item._archiveType === type)));
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(next));
      return true;
    } catch (e) {
      console.warn('Gagal memulihkan laporan dari arsip lokal:', e);
      return false;
    }
  }
};

window.TB_ARCHIVE = TB_ARCHIVE;

// ==========================================================================
// 4. REST API Client dengan Query Caching (Memory + Disk Storage)
// ==========================================================================
const API = {
  // Categories
  async getCategories() {
    const cacheKey = 'categories';
    const cached = getCached(cacheKey);
    if (cached && cached.data && cached.data.length) {
      return { ...cached, _fromDiskCache: true };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/categories`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.data && data.data.length) {
        setCached(cacheKey, data);
      }
      return data;
    } catch (err) {
      console.warn('[TemuBarang] Mengambil kategori dari cache...', err);
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
    const cached = getCached(cacheKey) || (!query ? getCached('lost_items_all') : null);

    // Cek disk/memory cache terlebih dahulu
    if (cached && cached.data && cached.data.length) {
      return { ...cached, _fromDiskCache: true };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/lost-items${query ? '?' + query : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.data && data.data.length) {
        setCached(cacheKey, data);
        if (!query) setCached('lost_items_all', data);
      }
      return data;
    } catch (err) {
      console.warn('[TemuBarang] Mengambil barang hilang dari cache...', err);
      if (cached && cached.data && cached.data.length) {
        return { ...cached, _isOffline: true };
      }
      throw err;
    }
  },

  async getLostItemById(id) {
    const cacheKey = `lost_item_${id}`;
    const cached = getCached(cacheKey);
    if (cached && cached.data) {
      return { ...cached, _fromDiskCache: true };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/lost-items/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.data) {
        setCached(cacheKey, data);
      }
      return data;
    } catch (err) {
      console.warn(`[TemuBarang] Mengambil detail hilang #${id} dari cache...`, err);
      if (cached && cached.data) return { ...cached, _isOffline: true };

      const allLost = getCached('lost_items_all') || getCached('lost_items_');
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
    // Invalidate query cache agar data baru langsung tampil
    invalidateCacheByPrefix('lost_items');
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
    invalidateCacheByPrefix('lost_items');
    invalidateCache(`lost_item_${id}`);
    return res.json();
  },

  async deleteLostItem(id) {
    if (!navigator.onLine) {
      throw new Error('Anda sedang offline. Hubungkan kembali koneksi internet untuk menghapus laporan.');
    }
    const res = await fetch(`${API_BASE_URL}/api/lost-items/${id}`, {
      method: 'DELETE'
    });
    invalidateCacheByPrefix('lost_items');
    invalidateCache(`lost_item_${id}`);
    return res.json();
  },

  // Found Items
  async getFoundItems(params = {}) {
    const query = new URLSearchParams(params).toString();
    const cacheKey = `found_items_${query}`;
    const cached = getCached(cacheKey) || (!query ? getCached('found_items_all') : null);

    // Cek disk/memory cache terlebih dahulu
    if (cached && cached.data && cached.data.length) {
      return { ...cached, _fromDiskCache: true };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/found-items${query ? '?' + query : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.data && data.data.length) {
        setCached(cacheKey, data);
        if (!query) setCached('found_items_all', data);
      }
      return data;
    } catch (err) {
      console.warn('[TemuBarang] Mengambil barang temuan dari cache...', err);
      if (cached && cached.data && cached.data.length) {
        return { ...cached, _isOffline: true };
      }
      throw err;
    }
  },

  async getFoundItemById(id) {
    const cacheKey = `found_item_${id}`;
    const cached = getCached(cacheKey);
    if (cached && cached.data) {
      return { ...cached, _fromDiskCache: true };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/found-items/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.data) {
        setCached(cacheKey, data);
      }
      return data;
    } catch (err) {
      console.warn(`[TemuBarang] Mengambil detail temuan #${id} dari cache...`, err);
      if (cached && cached.data) return { ...cached, _isOffline: true };

      const allFound = getCached('found_items_all') || getCached('found_items_');
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
    invalidateCacheByPrefix('found_items');
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
    invalidateCacheByPrefix('found_items');
    invalidateCache(`found_item_${id}`);
    return res.json();
  },

  async deleteFoundItem(id) {
    if (!navigator.onLine) {
      throw new Error('Anda sedang offline. Hubungkan kembali koneksi internet untuk menghapus laporan.');
    }
    const res = await fetch(`${API_BASE_URL}/api/found-items/${id}`, {
      method: 'DELETE'
    });
    invalidateCacheByPrefix('found_items');
    invalidateCache(`found_item_${id}`);
    return res.json();
  }
};
