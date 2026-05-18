const express = require("express");
const router = express.Router();

const upload =
  require("../cloudinaryStorage");

const Product = require("../models/Product");
const Business = require("../models/Business");
const BusinessWhatsApp =
  require("../models/BusinessWhatsApp");
const Order = require("../models/Order");
const Wallet = require("../models/Wallet");

/* =========================
   CREATE PRODUCT
========================= */

router.post(
  "/create",

  upload.single("image"),

  async (req, res) => {

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

    const image =
      req.file
      ? req.file.path
      : "";

    const product =
      await Product.create({

        name,
        price,
        stock,

        image,

        unitType,
        allowFractions,
        pricePerUnit,

        owner:
          business.owner,

        business:
          business._id,

        isActive: true
      });

    res.json({

      message:
        "Product created",

      product
    });

  } catch (err) {

    console.error(
      "CREATE PRODUCT ERROR:",
      err
    );

    res.status(500).json({
      message:
        err.message
    });
  }
});

/* =========================
   STORE PRODUCTS
========================= */

router.get(
  "/store/:slug",

  async (req, res) => {

  try {

    const business =
      await Business.findOne({

      slug:
        req.params.slug
    });

    if (!business) {

      return res.status(404).json({
        message:
          "Business not found"
      });
    }

    const products =
      await Product.find({

        business:
          business._id,

        isActive: true
      })
      .sort({
        createdAt: -1
      });

    res.json({

      business: {
        name:
          business.name,

        slug:
          business.slug,

        whatsappNumber:
          business.whatsappNumber
      },

      products
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message:
        err.message
    });
  }
});

/* =========================
   GET BUSINESS PRODUCTS
========================= */

router.get(
  "/my-products",

  async (req, res) => {

  try {

    const whatsappNumber =
      req.query.whatsappNumber;

    if (!whatsappNumber) {

      return res.status(400).json({
        message:
          "WhatsApp required"
      });
    }

    const business =
      await Business.findOne({
        whatsappNumber
      });

    if (!business) {

      return res.status(404).json({
        message:
          "Business not found"
      });
    }

    const products =
      await Product.find({

        business:
          business._id,

        isActive: true
      })
      .sort({
        createdAt: -1
      });

    res.json(products);

  } catch (err) {

    console.error(
      "LOAD PRODUCTS ERROR:",
      err
    );

    res.status(500).json({
      message:
        err.message
    });
  }
});

/* =========================
   CASH SALE
========================= */

router.post(
  "/cash-sale",

  async (req, res) => {

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
        message:
          "Missing fields"
      });
    }

    const business =
      await Business.findOne({
        whatsappNumber
      });

    if (!business) {

      return res.status(404).json({
        message:
          "Business not found"
      });
    }

    const wallet =
      await Wallet.findOne({

        owner:
          business._id,

        ownerType:
          "BUSINESS"
      });

    if (!wallet) {

      return res.status(404).json({
        message:
          "Business wallet not found"
      });
    }

    const products =
      await Product.find({

        business:
          business._id,

        name: {
          $regex:
            new RegExp(
              "^" +
              productName +
              "$",
              "i"
            )
        },

        isActive: true
      });

    if (!products.length) {

      return res.status(404).json({
        message:
          "Product not found"
      });
    }

    const product =
      products.find(
        p => p.stock > 0
      );

    if (!product) {

      return res.status(400).json({
        message:
          "Out of stock"
      });
    }

    const qty =
      Number(quantity);

    const unitPrice =
      product.pricePerUnit > 0
      ? product.pricePerUnit
      : product.price;

    const expectedTotal =
      Number(unitPrice) *
      Number(qty);

    if (
      Number(amount) !==
      Number(expectedTotal)
    ) {

      return res.status(400).json({

        message:
          `Incorrect amount. Expected KES ${expectedTotal}`
      });
    }

    if (product.stock < qty) {

      return res.status(400).json({
        message:
          "Insufficient stock"
      });
    }

    product.stock -= qty;

    await product.save();

    const order =
      await Order.create({

        business:
          business._id,

        businessWalletId:
          wallet._id,

        customerPhone:
          "WALK_IN_CUSTOMER",

        items: [
          {
            product:
              product._id,

            name:
              product.name,

            price:
              unitPrice,

            qty,

            lineTotal:
              expectedTotal
          }
        ],

        total:
          expectedTotal,

        status:
          "PAID",

        paymentMethod:
          "CASH",

        source:
          "MANUAL",

        paidAt:
          new Date()
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
      message:
        err.message
    });
  }
});

module.exports = router;
