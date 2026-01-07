const express = require("express");
const router = express.Router();

/*
  LOW STOCK ALERTS (MVP)
  Expose multiple paths to avoid frontend mismatch issues
*/

// /api/alerts/low-stock
router.get("/alerts/low-stock", async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error("Low stock error:", error);
    res.status(500).json({ message: "Failed to load low stock items" });
  }
});

// /api/low-stock (alias)
router.get("/low-stock", async (req, res) => {
  try {
    res.json([]);
  } catch (error) {
    console.error("Low stock alias error:", error);
    res.status(500).json({ message: "Failed to load low stock items" });
  }
});

module.exports = router;
