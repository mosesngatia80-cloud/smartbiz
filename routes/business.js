const express = require("express");
const router = express.Router();
const Business = require("../models/Business");
const auth = require("../middleware/auth");

/* =========================
   GET ALL BUSINESSES
========================= */
router.get("/", async (req, res) => {
  try {
    const businesses = await Business.find().sort({ createdAt: -1 });
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   SEARCH BUSINESS
========================= */
router.get("/search", async (req, res) => {
  try {
    const name = req.query.name;

    const business = await Business.findOne({
      name: new RegExp(name, "i")
    });

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    res.json(business);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE BUSINESS SLUG
========================= */
router.post("/update-slug", async (req, res) => {
  try {
    const { whatsappNumber, slug } = req.body;

    if (!whatsappNumber || !slug) {
      return res.status(400).json({
        message: "WhatsApp number and slug required"
      });
    }

    const business = await Business.findOne({ whatsappNumber });

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    business.slug = slug.toLowerCase().trim();
    await business.save();

    res.json({
      message: "Slug saved ✅",
      slug: business.slug,
      business
    });

  } catch (err) {
    console.error("UPDATE SLUG ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET STORE LINK
========================= */
router.get("/store-link", async (req, res) => {
  try {
    const { whatsappNumber } = req.query;

    if (!whatsappNumber) {
      return res.status(400).json({
        message: "WhatsApp number required"
      });
    }

    const business = await Business.findOne({ whatsappNumber });

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    const slug = (business.slug || business.name || "store")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    res.json({
      storeLink:
        "https://navu-smart-order.netlify.app/?store=" + slug
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* =========================
   UPDATE PROFILE
========================= */
router.put("/profile", auth, async (req, res) => {
  try {

    const {
      name,
      whatsappNumber,
      phone
    } = req.body;

    const business =
      await Business.findOne({
        owner: req.user.user
      });

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    if (name) {
      business.name = name;
    }

    if (whatsappNumber) {
      business.whatsappNumber =
        whatsappNumber;
    }

    if (phone) {
      business.phone = phone;
    }

    await business.save();

    res.json({
      success: true,
      business
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });

  }
});

module.exports = router;

