const express = require('express');
const router = express.Router();
const mangaPricesController = require('../controllers/mangaPricesController');

// GET manga prices
router.get('/prices', mangaPricesController.getMangaPrices);

module.exports = router;