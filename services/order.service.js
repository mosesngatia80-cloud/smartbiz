const Order = require("../models/Order");
const Customer = require("../models/Customer");
const Business = require("../models/Business");
const Product = require("../models/Product");
const InventoryTransaction = require("../models/InventoryTransaction");
const Revenue = require("../models/Revenue");

const { buildOrder } = require("./order.engine");
const EventBus = require("./event.bus");

/**
 * 🧠 CREATE ORDER (PRODUCTION SAFE + EVENTS)
 */
async function createOrder(data) {

  const built = await buildOrder(data);

  const business = await Business.findById(built.business);

  let customer = await Customer.findOne({
    business: built.business,
    phone: data.customerPhone
  });

  if (!customer && data.customerPhone) {
    customer = await Customer.create({
      owner: business?.owner || "",
      business: built.business,
      name: "WhatsApp Customer",
      phone: data.customerPhone
    });
  }

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

  for (const item of built.items) {

    const product = await Product.findById(item.product);

    if (!product) continue;

    const before = Number(product.stock || 0);

    product.stock = Math.max(0, before - item.qty);

    product.stockSold =
      Number(product.stockSold || 0) + item.qty;

    await product.save();

    await InventoryTransaction.create({
      business: product.business,
      product: product._id,
      action: "Sold",
      quantity: item.qty,
      stockBefore: before,
      stockAfter: product.stock
    });

  }

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

  const existingRevenue = await Revenue.findOne({
    order: order._id
  });

  if (!existingRevenue) {

    const grossAmount = Number(order.total || 0);
    const fee = 0;
    const netAmount = grossAmount - fee;

    await Revenue.create({
      business: order.business,
      order: order._id,
      grossAmount,
      fee,
      netAmount,
      channel: "wallet"
    });

  }

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
