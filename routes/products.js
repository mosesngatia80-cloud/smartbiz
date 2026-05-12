const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Business = require("../models/Business");
const BusinessWhatsApp =
  require("../models/BusinessWhatsApp");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");

/* =========================
   CREATE PRODUCT
========================= */
router.post("/create", async (req, res) => {

  try {

    const {
      name,
      price,
      stock = 0,
      whatsappNumber,
      unitType = "PIECE",
      allowFractions = false,
      pricePerUnit = 0
    } = req.body;

    if (
      !name ||
      price == null ||
      !whatsappNumber
    ) {
      return res.status(400).json({
        message: "Missing fields"
      });
    }

    const business =
      await Business.findOne({
        whatsappNumber
      });

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    const product =
      await Product.create({

        name,
        price,
        stock,

        unitType,
        allowFractions,
        pricePerUnit,

        owner: business.owner,

        business: business._id,

        isActive: true
      });

    res.json({
      message: "Product created",
      product
    });

  } catch (err) {

    console.error(
      "CREATE PRODUCT ERROR:",
      err
    );

    res.status(500).json({
      message: err.message
    });
  }
});

/* =========================
   GET BUSINESS PRODUCTS
========================= */
router.get("/my-products", async (req, res) => {

  try {

    const whatsappNumber =
      req.query.whatsappNumber;

    if (!whatsappNumber) {
      return res.status(400).json({
        message: "WhatsApp required"
      });
    }

    const linked =
      await BusinessWhatsApp.findOne({
        whatsappNumber
      });

    if (!linked) {
      return res.status(404).json({
        message: "Business not linked"
      });
    }

    const business =
      await Business.findById(
        linked.business
      );

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    const products =
      await Product.find({
        business: business._id,
        isActive: true
      })
      .sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {

    console.error(
      "LOAD PRODUCTS ERROR:",
      err
    );

    res.status(500).json({
      message: err.message
    });
  }
});

/* =========================
   CASH SALE (POS)
========================= */
router.post("/cash-sale", async (req, res) => {

  try {

    const {
      productName,
      amount,
      quantity = 1,
      whatsappNumber
    } = req.body;

    if (
      !productName ||
      !whatsappNumber
    ) {
      return res.status(400).json({
        message: "Missing fields"
      });
    }

    /* 🔍 FIND BUSINESS */

    const business =
      await Business.findOne({
        whatsappNumber
      });

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    /* 🔍 FIND WALLET */

    const wallet =
      await Wallet.findOne({
        owner: business._id,
        ownerType: "BUSINESS"
      });

    if (!wallet) {
      return res.status(404).json({
        message: "Business wallet not found"
      });
    }

    /* 🔍 FIND PRODUCT WITH STOCK */

    const products =
      await Product.find({

        business: business._id,

        name: productName,

        isActive: true
      })
      .sort({ createdAt: -1 });

    if (!products.length) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    /* ✅ PICK PRODUCT THAT HAS STOCK */

    const product =
      products.find(p => p.stock > 0);

    if (!product) {
      return res.status(400).json({
        message: "Out of stock"
      });
    }

    /* 📏 QUANTITY */

    const qty =
      Number(quantity);

    /* ❌ INVALID QUANTITY */

    if (qty <= 0) {

      return res.status(400).json({
        message: "Invalid quantity"
      });
    }

    /* ❌ FRACTIONS NOT ALLOWED */

    if (
      !product.allowFractions &&
      qty % 1 !== 0
    ) {

      return res.status(400).json({
        message:
          `${product.name} does not allow fractional selling`
      });
    }

    /* 💰 CALCULATE EXPECTED TOTAL */

    const unitPrice =
      product.pricePerUnit > 0
        ? product.pricePerUnit
        : product.price;

    const expectedTotal =
      Number(unitPrice) *
      Number(qty);

    /* ❌ VALIDATE AMOUNT */

    if (
      Number(amount) !==
      Number(expectedTotal)
    ) {

      return res.status(400).json({

        message:
          `Incorrect amount. ${qty} ${product.unitType} of ${product.name} costs KES ${expectedTotal}`
      });
    }

    /* 📦 CHECK STOCK */

    if (product.stock < qty) {

      return res.status(400).json({
        message: "Insufficient stock"
      });
    }

    /* ✅ REDUCE STOCK */

    product.stock -= qty;

    await product.save();

    /* =========================
       CREATE ORDER
    ========================= */

    const order =
      await Order.create({

        business: business._id,

        businessWalletId:
          wallet._id,

        customerPhone:
          "WALK_IN_CUSTOMER",

        items: [
          {
            product: product._id,
            name: product.name,
            price: unitPrice,
            qty: qty,
            lineTotal: expectedTotal
          }
        ],

        total: expectedTotal,

        status: "PAID",

        paymentMethod: "CASH",

        source: "MANUAL",

        paidAt: new Date()
      });

    res.json({

      message:
        "Cash sale recorded",

      remainingStock:
        product.stock,

      order,

      product
    });

  } catch (err) {

    console.error(
      "CASH SALE ERROR:",
      err
    );

    res.status(500).json({
      message: err.message
    });
  }
});


/* =========================
   GET PRODUCTS BY WHATSAPP
========================= */

router.get("/", async (req, res) => {

  try {

    const { whatsappNumber } = req.query;

    if (!whatsappNumber) {
      return res.status(400).json({
        message: "whatsappNumber required"
      });
    }

    const linked =
      await BusinessWhatsApp.findOne({
        whatsappNumber
      });

    if (!linked) {
      return res.status(404).json({
        message: "Business not linked"
      });
    }

    const business =
      await Business.findById(
        linked.business
      );

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    const products =
      await Product.find({
        business: business._id
      });

    res.json(products);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});


module.exports = router;
