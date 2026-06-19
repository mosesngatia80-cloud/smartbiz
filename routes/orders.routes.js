const express = require("express");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Business = require("../models/Business");
const Product = require("../models/Product");
const InventoryTransaction =
  require("../models/InventoryTransaction");

const router = express.Router();

/**
 * 🔥 FINAL DEBUG AUTH (DO NOT GUESS ANYMORE)
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log("🔥 AUTH HEADER:", authHeader);
  console.log("🔥 ENV JWT_SECRET:", process.env.JWT_SECRET);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const secrets = [
    process.env.JWT_SECRET,
    "navuSmartBizSecretKey2025",
    "smartbiz_secret_key",
    "smartbiz_secret"
  ];

  console.log("🔥 SECRETS BEING TESTED:", secrets);

  let decoded = null;
  let usedSecret = null;

  for (const secret of secrets) {
    try {
      decoded = jwt.verify(token, secret);
      usedSecret = secret;
      console.log("✅ JWT SUCCESS WITH:", secret);
      break;
    } catch (e) {
      console.log("❌ FAILED:", secret);
    }
  }

  if (!decoded) {
    console.log("🚨 FINAL RESULT: JWT REJECTED");
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log("✅ DECODED TOKEN:", decoded);

  req.userId = decoded.user || decoded.businessId || decoded.id;

  console.log("✅ USING USERID:", req.userId);

  next();
}

/* ================= GET ORDERS ================= */
router.get("/", auth, async (req, res) => {
  try {
    const business = await Business.findOne({
      owner: req.userId
    });

    console.log("🏢 BUSINESS FOUND:", business);

    if (!business) return res.json([]);

    const orders = await Order.find({
      business: business._id
    }).sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed" });
  }
});

/* ================= UPDATE STATUS ================= */
router.post("/:orderId/status", auth, async (req, res) => {
  try {

    const { status } = req.body;

    const order = await Order.findById(
      req.params.orderId
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    order.status = status;

    await order.save();

    res.json({
      success: true,
      status: order.status
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});

/* ================= CUSTOMERS ================= */
router.get("/customers/list", auth, async (req, res) => {
  try {

    const business = await Business.findOne({
      owner: req.userId
    });

    if (!business) {
      return res.json([]);
    }

    const orders = await Order.find({
      business: business._id
    });

    const map = {};

    orders.forEach(order => {

      const phone = order.customerPhone;

      if (!phone) return;

      if (!map[phone]) {
        map[phone] = {
          phone,
          totalOrders: 0,
          totalSpent: 0
        };
      }

      map[phone].totalOrders += 1;
      map[phone].totalSpent += Number(order.total || 0);
    });

    res.json(Object.values(map));

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});

router.post("/public-checkout", async (req, res) => {
  try {

    const {
      businessSlug,
      customerPhone,
      items
    } = req.body;

    if (!businessSlug || !customerPhone || !items || !items.length) {
      return res.status(400).json({
        message: "Missing checkout data"
      });
    }

    const business = await Business.findOne({
      slug: businessSlug
    });

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    let total = 0;
    const orderItems = [];

    for (const item of items) {

      const product = await Product.findOne({
        _id: item.productId,
        business: business._id
      });

      if (!product) {
        return res.status(404).json({
          message: "Product not found"
        });
      }

      const qty = Number(item.qty);

      if (product.stock < qty) {
        return res.status(400).json({
          message: `${product.name} out of stock`
        });
      }

      const before =
        Number(product.stock || 0);

      product.stock =
        Math.max(
          0,
          before - qty
        );

      product.stockSold =
        Number(
          product.stockSold || 0
        ) + qty;

      await product.save();

      const sellingPrice =
        product.salePrice > 0
          ? product.salePrice
          : product.price;

      await InventoryTransaction.create({
        business: product.business,
        product: product._id,

        action: "Sold",

        quantity: qty,

        buyingPrice:
          Number(product.costPrice || 0),

        sellingPrice:
          Number(sellingPrice || 0),

        profitPerUnit:
          Number(sellingPrice || 0) -
          Number(product.costPrice || 0),

        stockBefore: before,
        stockAfter: product.stock
      });

      const lineTotal =
        sellingPrice * qty;

      total += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: sellingPrice,
        qty,
        lineTotal
      });
    }

    const order = await Order.create({
      business: business._id,
      customerPhone,
      items: orderItems,
      total,
      status: "PENDING",
      paymentMethod: "CASH",
      source: "STORE_FRONT"
    });

    res.status(201).json({
      success: true,
      orderId: order._id,
      total
    });

  } catch (err) {

    console.error("PUBLIC CHECKOUT ERROR:", err);

    res.status(500).json({
      message: err.message
    });
  }
});

/* ================= CUSTOMER ORDERS ================= */

router.get(
  "/customer/:phone",
  async (req, res) => {

    try {

      const orders =
        await Order.find({
          customerPhone:
            req.params.phone
        })
        .sort({
          createdAt: -1
        });

      res.json(orders);

    } catch (err) {

      console.error(
        "CUSTOMER ORDERS ERROR:",
        err
      );

      res.status(500).json({
        message:
          "Failed to load orders"
      });
    }
  }
);

module.exports = router;
