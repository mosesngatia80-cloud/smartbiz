const Product = require("../models/Product");

/**
 * 🔒 ORDER ENGINE (PRODUCTION CORE)
 * Handles validation, stock, totals, and safety rules
 */

async function buildOrder({ business, items }) {

  if (!items || !items.length) {
    throw new Error("EMPTY_ITEMS");
  }

  let total = 0;
  const normalizedItems = [];

  for (const item of items) {

    const product = await Product.findById(item.product);

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const qty = Number(item.qty || item.quantity || 1);

    if (qty <= 0) {
      throw new Error("INVALID_QTY");
    }

    if (product.stock < qty) {
      throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
    }

    const lineTotal = product.price * qty;
    total += lineTotal;

    normalizedItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      qty,
      lineTotal
    });
  }

  return {
    business,
    items: normalizedItems,
    total
  };
}

module.exports = {
  buildOrder
};
