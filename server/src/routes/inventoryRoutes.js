const express = require('express');
const inventoryController = require('../controllers/inventoryController');

const router = express.Router();

router.route('/')
  .get(inventoryController.getAllInventory)
  .post(inventoryController.addInventoryItem);

router.route('/:id')
  .get(inventoryController.getInventoryById)
  .put(inventoryController.updateInventoryItem)
  .delete(inventoryController.deleteInventoryItem);

router.route('/status/:status')
  .get(inventoryController.getInventoryByStatus);

module.exports = router;