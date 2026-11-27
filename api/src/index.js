/**
 * ============================================================================
 * File: api/src/index.js
 * Fungsi:
 *   - Entry point server Express.js (REST API Backend).
 *   - Mengonfigurasi middleware: CORS, JSON parser (limit 15MB untuk foto base64).
 *   - Cache-Control Middleware: Mengirim header 'no-cache, must-revalidate' untuk API
 *     agar query caching di browser/disk dapat divalidasi dengan tepat.
 *   - Mendaftarkan rute API: /api/categories, /api/lost-items, /api/found-items.
 *   - Menyajikan berkas statis frontend PWA (/pwa) saat dijalankan di server lokal/monolith.
 * ============================================================================
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

const categoryRoutes = require('./routes/categoryRoutes');
const lostItemRoutes = require('./routes/lostItemRoutes');
const foundItemRoutes = require('./routes/foundItemRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Revalidasi Header: Selalu pastikan browser menanyakan data terbaru saat online agar sinkron lintas perangkat
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
  }
  next();
});

// API Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/lost-items', lostItemRoutes);
app.use('/api/found-items', foundItemRoutes);

// Sajikan Frontend PWA secara statis
const pwaPath = path.resolve(__dirname, '../../pwa');
if (fs.existsSync(pwaPath)) {
  app.use(express.static(pwaPath));
}

// API Health Check
app.get('/api', (req, res) => {
  res.json({
    message: 'TemuBarang API is running!',
    endpoints: {
      categories: '/api/categories',
      lost_items: '/api/lost-items',
      found_items: '/api/found-items'
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server TemuBarang berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
