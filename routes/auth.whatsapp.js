const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Business = require("../models/Business");

// =========================
// LOGIN / AUTO CREATE BUSINESS
// =========================
router.post("/login-whatsapp", async (req, res) => {
  try {
    const {
      whatsappNumber,
      name: businessName,
      password
    } = req.body;

    // validation
    if (!whatsappNumber || !businessName) {
      return res.status(400).json({
        message: "WhatsApp number and business name are required"
      });
    }

    let business = await Business.findOne({ whatsappNumber });

    // =========================
    // AUTO CREATE BUSINESS IF NOT EXISTS
    // =========================
    if (!business) {

      const slug = businessName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      business = await Business.create({
        name: businessName,
        slug,
        whatsappNumber,
        owner: whatsappNumber,
        password: await bcrypt.hash(password || "123456", 10)
      });
    }

    // success response
    return res.json({
      token: "demo-token-" + Date.now(),
      business
    });

  } catch (err) {
    console.error("login-whatsapp error:", err);
    return res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
