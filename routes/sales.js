const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
// const auth = require('../middleware/auth'); // uncomment if you have auth middleware

// Create sale
router.post('/', /* auth, */ saleController.createSale);

// List sales
router.get('/', /* auth, */ saleController.listSales);

// Get single sale
router.get('/:id', /* auth, */ saleController.getSale);

// Monthly report
router.get('/reports/monthly', /* auth, */ saleController.monthlyReport);

module.exports = router;
