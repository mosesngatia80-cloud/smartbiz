const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware"); // CommonJS-safe
const Business = require("../models/Business");

/**
 * CREATE BUSINESS
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Business name and phone are required" });
    }

    const encodedName = encodeURIComponent(name);
    const whatsappLink = `https://wa.me/${phone}?text=Hi%20I%20want%20to%20buy%20from%20${encodedName}`;

    const business = await Business.create({
      name,
      phone,
      owner: req.user.id,
      whatsappLink
    });

    return res.status(201).json({
      message: "Business created successfully",
      business
    });
  } catch (err) {
    console.error("CREATE BUSINESS ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});

/**
 * GET MY BUSINESSES
 */
router.get("/", auth, async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user.id });
    return res.json(businesses);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
