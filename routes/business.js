const express = require("express");
const router = express.Router();
const Business = require("../models/Business");
const verifyToken = require("../middleware/auth");

// Create a business (owner must be authenticated)
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, category, email, phone, address, tillNumber, storeNumber, operatorId, metadata } = req.body;
    const existing = await Business.findOne({ owner: req.user._id });
    if (existing) return res.status(400).json({ message: "Owner already has a business. Use update endpoint." });

    const business = new Business({
      owner: req.user._id,
      name,
      category,
      email,
      phone,
      address,
      tillNumber,
      storeNumber,
      operatorId,
      metadata
    });

    await business.save();
    res.json({ message: "Business created", business });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user's business
router.get("/me", verifyToken, async (req, res) => {
  try {
    const business = await Business.findOne({ owner: req.user._id });
    if (!business) return res.status(404).json({ message: "No business found for this user" });
    res.json({ business });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update business (only owner)
router.put("/", verifyToken, async (req, res) => {
  try {
    const updates = req.body;
    const business = await Business.findOneAndUpdate(
      { owner: req.user._id },
      { $set: updates },
      { new: true }
    );
    if (!business) return res.status(404).json({ message: "Business not found" });
    res.json({ message: "Business updated", business });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get business by id (public-ish, you can restrict)
router.get("/:id", async (req, res) => {
  try {
    const business = await Business.findById(req.params.id).populate("owner", "name email");
    if (!business) return res.status(404).json({ message: "Business not found" });
    res.json({ business });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
