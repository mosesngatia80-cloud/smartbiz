const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

const router = express.Router();

/* =========================
   REGISTER / AUTO CREATE
========================= */
router.post("/register", async (req, res) => {
  try {

    const { whatsapp, businessName } = req.body;

    if (!whatsapp || !businessName) {
      return res.status(400).json({
        message: "WhatsApp and Business Name required"
      });
    }

    let user = await User.findOne({
      whatsapp,
      businessName
    });

    /* AUTO CREATE USER */
    if (!user) {

      user = await User.create({
        whatsapp,
        businessName
      });

      /* CREATE BUSINESS */
      await Business.create({
        name: businessName,
        whatsapp,
        owner: user._id
      });

      /* CREATE WALLET */
      await Wallet.create({
        owner: user._id,
        ownerType: "USER",
        balance: 0,
        currency: "KES",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not set");
    }

    const payload = {
      user: user._id,
      business: businessName,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({ token });

  } catch (err) {

    console.error("Register error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {

  try {

    const { whatsapp, businessName } = req.body;

    if (!whatsapp || !businessName) {

      return res.status(400).json({
        message: "WhatsApp and Business Name required"
      });
    }

    let user = await User.findOne({
      whatsapp,
      businessName
    });

    /* AUTO CREATE IF NOT FOUND */
    if (!user) {

      user = await User.create({
        whatsapp,
        businessName
      });

      await Business.create({
        name: businessName,
        whatsapp,
        owner: user._id
      });

      await Wallet.create({
        owner: user._id,
        ownerType: "USER",
        balance: 0,
        currency: "KES",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not set");
    }

    const payload = {
      user: user._id,
      business: businessName,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({ token });

  } catch (err) {

    console.error("Login error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;
