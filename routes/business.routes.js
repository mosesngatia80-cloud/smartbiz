const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware").default;
const Business = require("../models/Business");

/**
 * CREATE BUSINESS
 */
router.post("/", auth, async (req, res) => {
  try {
    const business = await Business.create({
      ...req.body,
      owner: req.user.id
    });
    res.status(201).json(business);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET MY BUSINESSES
 */
router.get("/", auth, async (req, res) => {
  try {
    const businesses = await Business.find({ owner: req.user.id });
    res.json(businesses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
