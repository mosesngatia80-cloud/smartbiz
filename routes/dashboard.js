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

module.exports = router;
