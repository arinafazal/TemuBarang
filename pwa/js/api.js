// Konfigurasi endpoint API
const isFile = window.location.protocol === 'file:';
const isLocal = isFile || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '';
const API_BASE_URL = isLocal
  ? (window.location.port === '3000' ? '' : 'http://localhost:3000')
  : '';

const API = {
  // Categories
  async getCategories() {
    const res = await fetch(`${API_BASE_URL}/api/categories`);
    return res.json();
  },

  // Lost Items
  async getLostItems(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/api/lost-items${query ? '?' + query : ''}`);
    return res.json();
  },

  async getLostItemById(id) {
    const res = await fetch(`${API_BASE_URL}/api/lost-items/${id}`);
    return res.json();
  },

  async createLostItem(data) {
    const res = await fetch(`${API_BASE_URL}/api/lost-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateLostItem(id, data) {
    const res = await fetch(`${API_BASE_URL}/api/lost-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteLostItem(id) {
    const res = await fetch(`${API_BASE_URL}/api/lost-items/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Found Items
  async getFoundItems(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/api/found-items${query ? '?' + query : ''}`);
    return res.json();
  },

  async getFoundItemById(id) {
    const res = await fetch(`${API_BASE_URL}/api/found-items/${id}`);
    return res.json();
  },

  async createFoundItem(data) {
    const res = await fetch(`${API_BASE_URL}/api/found-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateFoundItem(id, data) {
    const res = await fetch(`${API_BASE_URL}/api/found-items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteFoundItem(id) {
    const res = await fetch(`${API_BASE_URL}/api/found-items/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  }
};
