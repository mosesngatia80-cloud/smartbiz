const express = require("express");

const router = express.Router();

const Debt = require("../models/Debt");
const Business = require("../models/Business");
const Product =
  require("../models/Product");
const InventoryTransaction =
  require("../models/InventoryTransaction");

/* =========================
   CREATE DEBT
========================= */

router.post(
  "/create",
  async (req, res) => {

  try {

    const {
      phone,
      customerName,
      customerPhone,
      totalAmount,
      amountPaid,
      note,
      debtType,
      productId,
      qty
    } = req.body;

    const business =
      await Business.findOne({
        whatsappNumber: phone
      });

    if (!business) {

      return res.status(404)
      .json({
        message:
          "Business not found"
      });
    }

    let total =
      Number(totalAmount || 0);

    let product;
    let quantity = 0;

    if (
      debtType === "PRODUCT"
    ) {

      product =
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

      quantity =
        Number(qty || 0);

      if (
        quantity <= 0
      ) {

        return res.status(400)
        .json({
          message:
            "Invalid quantity"
        });
      }

      if (
        product.stock <
        quantity
      ) {

        return res.status(400)
        .json({
          message:
            "Insufficient stock"
        });
      }

      total =
        Number(product.price) *
        quantity;

    }

    const paid =
      Number(amountPaid || 0);

    total =
      Number(total);

    const balance =
      total - paid;

    let status =
      "UNPAID";

    if (
      paid > 0 &&
      balance > 0
    ) {

      status = "PARTIAL";
    }

    if (balance <= 0) {

      status = "PAID";
    }

    const debt =
      await Debt.create({

      business:
        business._id,

      customerName,

      customerPhone,

      totalAmount:
        total,

      amountPaid:
        paid,

      balance,

      status,

      note
    });

    if (
      debtType === "PRODUCT"
    ) {

      const before =
        product.stock;

      product.stock =
        Math.max(
          0,
          product.stock - quantity
        );

      product.stockSold =
        Number(
          product.stockSold || 0
        ) + quantity;

      await product.save();

      await InventoryTransaction.create({
        business: product.business,
        product: product._id,
        action: "Sold",
        quantity,
        stockBefore: before,
        stockAfter: product.stock
      });

    }

    res.json({

      message:
        "Debt created ✅",

      debt
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
   UPDATE DEBT PAYMENT
========================= */

router.post(
  "/pay/:id",
  async (req, res) => {

  try {

    const {
      amount
    } = req.body;

    const debt =
      await Debt.findById(
        req.params.id
      );

    if (!debt) {

      return res.status(404)
      .json({
        message:
          "Debt not found"
      });
    }

    debt.amountPaid =
      Number(
        debt.amountPaid
      ) +
      Number(amount);

    debt.balance =
      Number(
        debt.totalAmount
      ) -
      Number(
        debt.amountPaid
      );

    if (
      debt.balance <= 0
    ) {

      debt.balance = 0;

      debt.status =
        "PAID";

    } else {

      debt.status =
        "PARTIAL";
    }

    await debt.save();

    res.json({

      message:
        "Payment recorded ✅",

      debt
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
   GET DEBTS
========================= */

router.get(
  "/",
  async (req, res) => {

  try {

    const {
      phone
    } = req.query;

    const business =
      await Business.findOne({
        whatsappNumber: phone
      });

    if (!business) {

      return res.status(404)
      .json({
        message:
          "Business not found"
      });
    }

    const debts =
      await Debt.find({

      business:
        business._id

    }).sort({
      createdAt: -1
    });

    const totalDebt =
      debts.reduce(

        (sum, d) =>

        sum + Number(d.balance),

        0
      );

    res.json({

      totalDebt,

      debts
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message:
        err.message
    });
  }
});

module.exports = router;
