const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Business = require("../models/Business");

/* =========================
   CREATE PRODUCT
========================= */
router.post("/create", async (req, res) => {

  try {

    const {
      name,
      price,
      stock = 0,
      whatsappNumber
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

    /* ✅ CREATE PRODUCT */
    const product =
      await Product.create({

        name,
        price,
        stock,

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

    /* ✅ ONLY THIS BUSINESS PRODUCTS */
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

module.exports = router;
