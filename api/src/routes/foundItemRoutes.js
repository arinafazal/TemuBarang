const express = require('express');
const router = express.Router();
const foundItemController = require('../controllers/foundItemController');

router.get('/', foundItemController.getAllFoundItems);
router.get('/:id', foundItemController.getFoundItemById);
router.post('/', foundItemController.createFoundItem);
router.put('/:id', foundItemController.updateFoundItem);
router.delete('/:id', foundItemController.deleteFoundItem);

module.exports = router;
