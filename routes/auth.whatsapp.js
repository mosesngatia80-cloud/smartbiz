const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Business = require("../models/Business");

/*
 🔐 LOGIN WITH WHATSAPP
*/
router.post("/login-whatsapp", async (req, res) => {
  try {
    const { whatsappNumber, name } = req.body;

    if (!whatsappNumber) {
      return res.status(400).json({ message: "WhatsApp required" });
    }

    let business = await Business.findOne({ whatsappNumber });

    // ✅ AUTO CREATE (MVP)
    if (!business) {
      business = await Business.create({
        name: name || "My Business",
        whatsappNumber,
        owner: whatsappNumber
      });
    }

    // 🔐 SIMPLE TOKEN
    const token = jwt.sign(
      { user: business.owner },
      process.env.JWT_SECRET || "smartbiz_secret",
      { expiresIn: "7d" }
    );

    res.json({ token, business });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
