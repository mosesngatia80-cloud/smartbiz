const express = require("express");

const router = express.Router();

const Business =
  require("../models/Business");

const Expense =
  require("../models/Expense");

const Order =
  require("../models/Order");

/* =========================
   GET BUSINESS PROFIT
========================= */

router.get(
  "/summary",
  async (req, res) => {

  try {

    const {
      whatsappNumber
    } = req.query;

    if (!whatsappNumber) {

      return res.status(400).json({
        message:
          "WhatsApp number required"
      });
    }

    /* =========================
       FIND BUSINESS
    ========================= */

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

    /* =========================
       REVENUE
    ========================= */

    const paidOrders =
      await Order.find({
        business:
          business._id,

        status: "PAID"
      });

    const revenue =
      paidOrders.reduce(
        (sum, order) =>
          sum + Number(order.total),
        0
      );

    /* =========================
       EXPENSES
    ========================= */

    const expenses =
      await Expense.find({
        business:
          business._id
      });

    const totalExpenses =
      expenses
        .filter(
          expense =>
            expense.category !==
            "INVENTORY_PURCHASE"
        )
        .reduce(
          (sum, expense) =>
            sum + Number(expense.amount),
          0
        );

    /* =========================
       PROFIT
    ========================= */

    const profit =
      revenue - totalExpenses;

    /* =========================
       RESPONSE
    ========================= */

    res.json({

      success: true,

      business: business.name,

      revenue,

      expenses:
        totalExpenses,

      profit,

      totalOrders:
        paidOrders.length
    });

  } catch (err) {

    console.error(
      "❌ Profit summary error:",
      err
    );

    res.status(500).json({
      message:
        "Failed to calculate profit"
    });
  }
});

module.exports = router;
