const express = require("express");
const router = express.Router();

/*
  SMART BIZ – DASHBOARD ENDPOINTS (MVP)
  These endpoints unblock the frontend dashboard.
  Real aggregation logic can be added later.
*/

// GET /api/sales/summary
router.get("/sales/summary", async (req, res) => {
  try {
    res.json({
      today: 0,
      week: 0,
      month: 0,
    });
  } catch (error) {
    console.error("Sales summary error:", error);
    res.status(500).json({ message: "Failed to load sales summary" });
  }
});

// GET /api/sales/summary/monthly
router.get("/sales/summary/monthly", async (req, res) => {
  try {
    res.json({
      total: 0,
    });
  } catch (error) {
    console.error("Monthly summary error:", error);
    res.status(500).json({ message: "Failed to load monthly summary" });
  }
});

// GET /api/alerts/low-stock
router.get("/alerts/low-stock", async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error("Low stock error:", error);
    res.status(500).json({ message: "Failed to load low stock alerts" });
  }
});


const Business =
  require("../models/Business");

const Wallet =
  require("../models/Wallet");

const Order =
  require("../models/Order");

const Expense =
  require("../models/Expense");

const Booking =
  require("../models/Booking");

const Revenue =
  require("../models/Revenue");

const Debt =
  require("../models/Debt");

const InventoryTransaction =
  require("../models/InventoryTransaction");

/* =========================
   FULL DASHBOARD SUMMARY
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
       WALLET
    ========================= */

    const wallet =
      await Wallet.findOne({
        owner: business._id,
        ownerType: "BUSINESS"
      });

    const walletBalance =
      wallet
        ? wallet.balance
        : 0;

    /* =========================
       ORDERS
    ========================= */

    const orders =
      await Order.find({
        business: business._id
      });

    const paidOrders =
      orders.filter(
        o => o.status === "PAID"
      );

    const totalSales =
      paidOrders.length;


    const revenues =
      await Revenue.find({
        business: business._id
      });

    const totalRevenue =
      revenues.reduce(
        (sum, r) =>
          sum + Number(
            r.netAmount || 0
          ),
        0
      );

    const serviceRevenue =
      revenues
        .filter(
          r =>
            r.sourceType ===
            "BOOKING"
        )
        .reduce(
          (sum, r) =>
            sum + Number(
              r.netAmount || 0
            ),
          0
        );

    /* =========================
       EXPENSES
    ========================= */

    const expenses =
      await Expense.find({
        business: business._id
      });

    const totalExpenses =
      expenses.reduce(
        (sum, e) =>
          sum + Number(e.amount),
        0
      );

    const debts =
      await Debt.find({
        business: business._id
      });

    const totalDebt =
      debts.reduce(
        (sum, d) =>
          sum + Number(d.totalAmount || 0),
        0
      );

    const outstandingDebt =
      debts.reduce(
        (sum, d) =>
          sum + Number(d.balance || 0),
        0
      );

    const paidDebt =
      totalDebt -
      outstandingDebt;

    const inventoryTransactions =
      await InventoryTransaction.find({
        business: business._id,
        action: "Sold"
      });

    const grossProductProfit =
      inventoryTransactions.reduce(
        (sum, t) =>
          sum +
          (
            Number(t.profitPerUnit || 0) *
            Number(t.quantity || 0)
          ),
        0
      );

    /* =========================
       PROFIT
    ========================= */

    const profit =
      totalRevenue -
      totalExpenses;

    res.json({

      success: true,

      business:
        business.name,

      totalSales,

      walletBalance,

      revenue:
        totalRevenue,

      serviceRevenue,

      expenses:
        totalExpenses,

      totalDebt,

      outstandingDebt,

      paidDebt,

      grossProductProfit,

      profit,

      totalOrders:
        orders.length
    });

  } catch (err) {

    console.error(
      "❌ Dashboard summary error:",
      err
    );

    res.status(500).json({
      message:
        "Failed to load dashboard"
    });
  }
});



module.exports = router;
