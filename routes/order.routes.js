import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  markOrderPaid
} from "../controllers/order.controller.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", auth, createOrder);
router.get("/", auth, getOrders);
router.get("/:id", auth, getOrderById);
router.put("/:id/pay", auth, markOrderPaid);

export default router;
