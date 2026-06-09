const express = require("express");
const {
  createOrder,
  getOrders,
  getOrderById,
  markOrderPaid
} = require("../controllers/order.controller.js");
const auth = require("../middleware/auth.js");

const router = express.Router();

router.post("/", auth, createOrder);
router.get("/", auth, getOrders);
router.get("/:id", auth, getOrderById);
router.put("/:id/pay", auth, markOrderPaid);


module.exports = router;
