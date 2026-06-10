const Order = require("../models/Order");
const { buildOrder } = require("./order.engine");
const EventBus = require("./event.bus");

/**
 * 🧠 CREATE ORDER (PRODUCTION SAFE + EVENTS)
 */
async function createOrder(data) {

  const built = await buildOrder(data);

  const order = await Order.create({
    business: built.business,
    items: built.items,
    total: built.total,
    status: data.status || "UNPAID",
    paymentMethod: data.paymentMethod || "CASH",
    source: data.source || "API",
    customerPhone: data.customerPhone,
    businessWalletId: data.businessWalletId,
    customerUserId: data.customerUserId
  });

  // 📡 EVENT: ORDER CREATED
  EventBus.emit("ORDER_CREATED", order);

  return order;
}

/**
 * 💳 MARK PAID + EVENT
 */
async function markOrderPaid(orderId, paymentRef = null) {

  const order = await Order.findById(orderId);
  if (!order) return null;

  if (order.status === "PAID") return order;

  order.status = "PAID";
  order.paymentRef = paymentRef;
  order.paidAt = new Date();

  await order.save();

  // 📡 EVENT: ORDER PAID
  EventBus.emit("ORDER_PAID", order);

  return order;
}

async function getOrdersByBusiness(businessId) {
  return await Order.find({ business: businessId }).sort({ createdAt: -1 });
}

async function getOrderById(orderId) {
  return await Order.findById(orderId);
}

module.exports = {
  createOrder,
  getOrdersByBusiness,
  getOrderById,
  markOrderPaid
};
