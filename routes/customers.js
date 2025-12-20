const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware").default;
const Customer = require("../models/Customer");

// Get all customers for logged-in business
router.get("/", auth, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const customers = await Customer.find({ businessId });
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// Create a customer
router.post("/", auth, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { name, phone, email } = req.body;

    const created = await Customer.create({
      name,
      phone,
      email,
      businessId,
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

module.exports = router;
