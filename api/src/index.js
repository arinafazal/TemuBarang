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

// Disk Cache Header: Mengaktifkan HTTP Disk Cache browser (agar muncul "(disk cache)" di Network tab)
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
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
