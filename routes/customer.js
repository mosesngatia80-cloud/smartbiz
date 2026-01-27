const express = require("express");
const router = express.Router();

const Customer = require("../models/Customer");
const Business = require("../models/Business");
const verifyToken = require("../middleware/authMiddleware").default;

// CREATE CUSTOMER
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    const business = await Business.findOne({ owner: req.user._id });
    if (!business) return res.status(404).json({ message: "No business found." });

    const customer = new Customer({
      owner: req.user._id,
      business: business._id,
      name,
      phone,
      email,
      address
    });

    await customer.save();
    res.json({ message: "Customer added", customer });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL CUSTOMERS
router.get("/", verifyToken, async (req, res) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    const customers = await Customer.find({ business: business._id });
    res.json({ customers });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SINGLE CUSTOMER (ADDED BLOCK)
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ customer });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE CUSTOMER
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updates = req.body;
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true }
    );

    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer updated", customer });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE CUSTOMER
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await Customer.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!deleted) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
