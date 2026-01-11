const express = require("express");
const router = express.Router();
const Business = require("../models/Business");

/**
 * GET /api/internal/business/link?phone=254...
 * Internal-only endpoint for Smart Connect
 */
router.get("/business/link", async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const business = await Business.findOne({ phone });

    if (!business || !business.vendorLink) {
      return res.status(404).json({ message: "Business not found" });
    }

    return res.json({ vendorLink: business.vendorLink });
  } catch (err) {
    console.error("Internal business link error:", err);
    return res.status(500).json({ message: "Failed to fetch business link" });
  }
});

module.exports = router;
