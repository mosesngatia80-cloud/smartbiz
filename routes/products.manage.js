const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Product = require("../models/Product");

/**
 * ===========================
 * SOFT DELETE PRODUCT
 * ===========================
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      _id: id,
      owner: req.user.user,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = false;
    product.deletedAt = new Date();
    await product.save();

    return res.json({
      message: "Product deleted successfully",
      productId: product._id
    });
  } catch (err) {
    console.error("❌ DELETE PRODUCT ERROR:", err.message);
    return res.status(500).json({ message: "Failed to delete product" });
  }
});

/**
 * ===========================
 * RESTORE PRODUCT
 * ===========================
 */
router.post("/:id/restore", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      _id: id,
      owner: req.user.user,
      isActive: false
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found or already active" });
    }

    product.isActive = true;
    product.deletedAt = null;
    await product.save();

    return res.json({
      message: "Product restored successfully",
      productId: product._id
    });
  } catch (err) {
    console.error("❌ RESTORE PRODUCT ERROR:", err.message);
    return res.status(500).json({ message: "Failed to restore product" });
  }
});

module.exports = router;
