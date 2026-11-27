/**
 * ============================================================================
 * File: api/src/routes/categoryRoutes.js
 * Fungsi:
 *   - Mendefinisikan endpoint routing Express untuk entitas Kategori (/api/categories).
 *   - Memetakan method HTTP (GET, POST, PUT, DELETE) ke handler di categoryController.js.
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
