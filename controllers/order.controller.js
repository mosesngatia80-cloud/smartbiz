const {
  createOrder,
  getOrdersByBusiness,
  getOrderById,
  markOrderPaid
} = require("../services/order.service");

const Business = require("../models/Business");

/**
 * GET ORDERS (Dashboard)
 */
exports.getOrders = async (req, res) => {
  try {
    const business = await Business.findOne({ owner: req.userId });
    if (!business) return res.json([]);

    const orders = await getOrdersByBusiness(business._id);
    res.json(orders);
  } catch (err) {
    console.error("getOrders error:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

/**
 * GET ORDER BY ID
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ message: "Not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Error fetching order" });
  }
};

/**
 * CREATE ORDER (SAFE WRAPPER ONLY)
 */
exports.createOrder = async (req, res) => {
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (err) {
    console.error("createOrder error:", err.message);
    res.status(500).json({ message: "Failed to create order" });
  }
};

/**
 * MARK AS PAID
 */
exports.markOrderPaid = async (req, res) => {
  try {
    const order = await markOrderPaid(
      req.params.id,
      req.body.paymentRef
    );

    if (!order) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to update order" });
  }
};
