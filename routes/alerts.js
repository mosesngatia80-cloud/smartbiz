const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware").default;
const Product = require("../models/Product");

router.get("/low-stock", auth, async (req, res) => {
  try {
    const businessId = req.user.businessId;

    const items = await Product.find({
      businessId,
      stock: { $lte: 3 }
    });

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
