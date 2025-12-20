import express from "express";
import auth from "../middleware/auth.js";
import Product from "../models/Product.js";

const router = express.Router();

/**
 * GET PRODUCTS (BY BUSINESS)
 */
router.get("/", auth, async (req, res) => {
  try {
    const products = await Product.find({
      business: req.user.business
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * CREATE PRODUCT
 */
router.post("/", auth, async (req, res) => {
  try {
    const { name, price, stock, description } = req.body;

    const product = await Product.create({
      name,
      price,
      stock,
      description,
      owner: req.user._id,
      business: req.user.business
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
