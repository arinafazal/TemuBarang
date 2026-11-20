const express = require('express');
const router = express.Router();
const lostItemController = require('../controllers/lostItemController');

router.get('/', lostItemController.getAllLostItems);
router.get('/:id', lostItemController.getLostItemById);
router.post('/', lostItemController.createLostItem);
router.put('/:id', lostItemController.updateLostItem);
router.delete('/:id', lostItemController.deleteLostItem);

module.exports = router;
