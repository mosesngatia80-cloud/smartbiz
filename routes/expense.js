const express = require("express");
const router = express.Router();

const Expense = require("../models/Expense");
const Business = require("../models/Business");
const Product =
  require("../models/Product");
const InventoryTransaction =
  require("../models/InventoryTransaction");

/* =========================
   CREATE EXPENSE
========================= */

router.post("/create", async (req, res) => {

  try {

    const {
      whatsappNumber,
      title,
      amount,
      category,
      note,
      productId,
      quantity,
      supplier
    } = req.body;

    if (
      !whatsappNumber ||
      !title ||
      !amount
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

    let calculatedAmount =
      Number(amount || 0);

    if (
      productId &&
      Number(quantity || 0) > 0
    ) {

      const product =
        await Product.findById(
          productId
        );

      if (!product) {

        return res.status(404)
        .json({
          message:
            "Product not found"
        });
      }

      const qty =
        Number(quantity || 0);

      calculatedAmount =
        Number(product.costPrice || 0) *
        qty;

      if (qty <= 0) {

        return res.status(400)
        .json({
          message:
            "Invalid quantity"
        });
      }

      const before =
        Number(product.stock || 0);

      product.stock =
        before + qty;

      product.stockAdded =
        Number(
          product.stockAdded || 0
        ) + qty;

      await product.save();

      await InventoryTransaction.create({
        business: product.business,
        product: product._id,
        action: "Added",
        quantity: qty,
        stockBefore: before,
        stockAfter: product.stock
      });

    }

    /* ✅ CREATE EXPENSE */

    const expense =
      await Expense.create({

        business:
          business._id,

        owner:
          business.owner,

        title,

        amount:
          (
            productId &&
            Number(quantity || 0) > 0
          )
            ? calculatedAmount
            : Number(amount),

        category:
          (
            productId &&
            Number(quantity || 0) > 0
          )
            ? "INVENTORY_PURCHASE"
            : (category || "GENERAL"),

        product:
          productId || null,

        quantity:
          Number(quantity || 0),

        supplier:
          supplier || "",

        note:
          note || ""
      });

    res.json({

      message:
        "Expense created ✅",

      expense
    });

  } catch (err) {

    console.error(
      "CREATE EXPENSE ERROR:",
      err
    );

    res.status(500).json({
      message: err.message
    });
  }
});

/* =========================
   GET BUSINESS EXPENSES
========================= */

router.get("/", async (req, res) => {

  try {

    const whatsappNumber =
      req.query.whatsappNumber;

    if (!whatsappNumber) {

      return res.status(400).json({
        message:
          "WhatsApp number required"
      });
    }

    /* 🔍 FIND BUSINESS */

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

    /* ✅ LOAD EXPENSES */

    const expenses =
      await Expense.find({
        business:
          business._id
      })
      .sort({
        createdAt: -1
      });

    /* 💰 TOTAL EXPENSES */

    const totalExpenses =
      expenses.reduce(
        (sum, e) =>
          sum + e.amount,
        0
      );

    res.json({

      totalExpenses,

      expenses
    });

  } catch (err) {

    console.error(
      "GET EXPENSES ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Failed to fetch expenses"
    });
  }
});

module.exports = router;
