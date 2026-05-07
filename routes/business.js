const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

/**
 * ================================
 * CREATE / ENSURE BUSINESS + WALLET
 * ================================
 * - Idempotent
 * - Safe to call multiple times
 * - Allows WhatsApp number linking
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, category, phone, whatsappNumber } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Business name and phone required"
      });
    }

    const userId = req.user.user;

    let business = await Business.findOne({
      owner: userId
    });

    if (!business) {

      business = await Business.create({
        name,
        category,
        phone,
        whatsappNumber:
          whatsappNumber || phone,
        owner: userId
      });

    } else {

      if (
        whatsappNumber &&
        business.whatsappNumber !== whatsappNumber
      ) {

        business.whatsappNumber =
          whatsappNumber;

        await business.save();
      }
    }

    let wallet = await Wallet.findOne({
      owner: business._id,
      ownerType: "BUSINESS"
    });

    if (!wallet) {

      wallet = await Wallet.create({
        owner: business._id,
        ownerType: "BUSINESS",
        balance: 0,
        currency: "KES"
      });
    }

    if (!business.walletId) {

      business.walletId = wallet._id;

      await business.save();
    }

    return res.status(200).json({

      message: "Business ready",

      business,

      wallet
    });

  } catch (err) {

    console.error(
      "❌ Business setup error:",
      err.message
    );

    return res.status(500).json({
      message: "Failed to setup business",
      error: err.message
    });
  }
});

/**
 * =================
 * GET MY BUSINESS
 * =================
 */
router.get("/me", auth, async (req, res) => {
  try {

    const userId = req.user.user;

    const business =
      await Business.findOne({
        owner: userId
      });

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    const wallet = await Wallet.findOne({
      owner: business._id,
      ownerType: "BUSINESS"
    });

    res.json({
      business,
      wallet
    });

  } catch (err) {

    res.status(500).json({
      message: "Failed to fetch business"
    });
  }
});

/*
 🔓 PUBLIC: Get all businesses (MVP TEST)
*/
router.get("/public/all", async (req, res) => {
  try {

    const businesses =
      await Business.find()
      .sort({ createdAt: -1 });

    res.json(businesses);

  } catch (err) {

    console.error(
      "Public business error:",
      err.message
    );

    res.status(500).json({
      message: "Failed to load businesses"
    });
  }
});

/*
 🔍 PUBLIC: Find business by WhatsApp number
*/
router.get("/by-whatsapp", async (req, res) => {
  try {

    const { number } = req.query;

    const business =
      await Business.findOne({
        whatsappNumber: number
      });

    if (!business) {
      return res.status(404).json({
        message: "Business not found"
      });
    }

    res.json(business);

  } catch (err) {

    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;
