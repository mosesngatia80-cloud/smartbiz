const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const Customer = require("../models/Customer");
const Business = require("../models/Business");

/**
 * =========================
 * GET CUSTOMERS
 * =========================
 */
router.get("/", auth, async (req, res) => {
  try {

    const userId = req.user.user;

    const business = await Business.findOne({
      owner: userId
    });

    if (!business) {
      return res.status(400).json({
        message: "User has no business"
      });
    }

    const customers = await Customer.find({
      business: business._id
    });

    res.status(200).json(customers);

  } catch (err) {

    res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
});

/**
 * =========================
 * CREATE CUSTOMER
 * =========================
 */
router.post("/", auth, async (req, res) => {
  try {

    const userId = req.user.user;

    const business = await Business.findOne({
      owner: userId
    });

    if (!business) {
      return res.status(400).json({
        message: "User has no business"
      });
    }

    const {
      name,
      phone
    } = req.body;

    const created = await Customer.create({

      owner: userId,

      business: business._id,

      name,

      phone
    });

    res.status(201).json(created);

  } catch (err) {

    res.status(500).json({
      message: "Server Error",
      error: err.message
    });
  }
});

module.exports = router;
