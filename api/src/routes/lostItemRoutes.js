/**
 * ============================================================================
 * File: api/src/routes/lostItemRoutes.js
 * Fungsi:
 *   - Mendefinisikan endpoint routing Express untuk Barang Hilang (/api/lost-items).
 *   - Memetakan method HTTP (GET, POST, PUT, DELETE) ke handler di lostItemController.js.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const lostItemController = require('../controllers/lostItemController');

router.get('/', lostItemController.getAllLostItems);
router.get('/:id', lostItemController.getLostItemById);
router.post('/', lostItemController.createLostItem);
router.put('/:id', lostItemController.updateLostItem);
router.delete('/:id', lostItemController.deleteLostItem);

module.exports = router;
