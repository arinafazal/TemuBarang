/**
 * ============================================================================
 * File: api/src/routes/foundItemRoutes.js
 * Fungsi:
 *   - Mendefinisikan endpoint routing Express untuk Barang Temuan (/api/found-items).
 *   - Memetakan method HTTP (GET, POST, PUT, DELETE) ke handler di foundItemController.js.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const foundItemController = require('../controllers/foundItemController');

router.get('/', foundItemController.getAllFoundItems);
router.get('/:id', foundItemController.getFoundItemById);
router.post('/', foundItemController.createFoundItem);
router.put('/:id', foundItemController.updateFoundItem);
router.delete('/:id', foundItemController.deleteFoundItem);

module.exports = router;
