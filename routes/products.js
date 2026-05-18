const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Business = require("../models/Business");

/* ✅ FIXED AUTH IMPORT */
const verifyToken = require("../middleware/authMiddleware");

/* CLOUDINARY + MULTER */
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/* =========================
   CLOUDINARY CONFIG
========================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* =========================
   STORAGE
========================= */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "navu-smartbiz-products",
    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ],
  },
});

const upload = multer({ storage });

/* =========================
   CREATE PRODUCT
========================= */
router.post(
  "/",
  upload.single("image"),
  async (req, res) => {

    try {

      console.log("BODY:", req.body);
      console.log("FILE:", req.file);

      const {
        name,
        category,
        price,
        stock,
        description,
        whatsappNumber
      } = req.body;

      if (!whatsappNumber) {
        return res.status(400).json({
          message: "WhatsApp number required"
        });
      }

      const business =
        await Business.findOne({
          whatsappNumber
        });

      if (!business) {
        return res.status(404).json({
          message: "Business not found"
        });
      }

      const product = new Product({
        owner: business.owner,
        business: business._id,
        name,
        category,
        price,
        stock,
        description,

        image: req.file
          ? req.file.path
          : ""
      });

      await product.save();

      res.json({
        message: "Product created",
        product
      });

    } catch (err) {

      console.error(
        "UPLOAD ERROR:"
      );

      console.error(err);

      res.status(500).json({
        error: err.message
      });

    }

  }
);

/* =========================
   MY PRODUCTS
========================= */
router.get(
  "/my-products",
  async (req, res) => {

    try {

      const {
        whatsappNumber
      } = req.query;

      if (!whatsappNumber) {
        return res.status(400).json({
          message:
            "WhatsApp number required"
        });
      }

      const business =
        await Business.findOne({
          whatsappNumber
        });

      if (!business) {
        return res.status(404).json({
          message:
            "Business not found"
        });
      }

      const products =
        await Product.find({
          business: business._id
        }).sort({
          createdAt: -1
        });

      res.json(products);

    } catch (err) {

      console.error(
        "MY PRODUCTS ERROR:",
        err
      );

      res.status(500).json({
        message:
          "Failed to load products"
      });

    }

  }
);

/* =========================
   GET ALL PRODUCTS
========================= */
router.get(
  "/",
  verifyToken,
  async (req, res) => {

    try {

      const business =
        await Business.findOne({
          owner: req.user._id
        });

      const products =
        await Product.find({
          business: business._id
        });

      res.json({
        products
      });

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  }
);

/* =========================
   UPDATE PRODUCT
========================= */
router.put(
  "/:id",
  verifyToken,
  async (req, res) => {

    try {

      const updates =
        req.body;

      const product =
        await Product.findOneAndUpdate(
          {
            _id: req.params.id,
            owner: req.user._id
          },
          updates,
          { new: true }
        );

      if (!product) {

        return res.status(404).json({
          message:
            "Product not found"
        });

      }

      res.json({
        message:
          "Product updated",
        product
      });

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  }
);

/* =========================
   DELETE PRODUCT
========================= */
router.delete(
  "/:id",
  verifyToken,
  async (req, res) => {

    try {

      const deleted =
        await Product.findOneAndDelete({
          _id: req.params.id,
          owner: req.user._id
        });

      if (!deleted) {

        return res.status(404).json({
          message:
            "Product not found"
        });

      }

      res.json({
        message:
          "Product deleted"
      });

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }

  }
);

/* =========================
   PUBLIC CREATE PRODUCT
========================= */
router.post(
  "/public/create",
  upload.single("image"),

  async (req, res) => {

    try {

      console.log(
        "PUBLIC BODY:",
        req.body
      );

      console.log(
        "PUBLIC FILE:",
        req.file
      );

      const {
        name,
        category,
        price,
        stock,
        description
      } = req.body;

      if (
        !name ||
        price == null
      ) {

        return res.status(400).json({
          message:
            "Missing fields"
        });

      }

      const business =
        await Business.findOne();

      if (!business) {

        return res.status(400).json({
          message:
            "No business found in system"
        });

      }

      const product =
        new Product({

          owner:
            business.owner,

          business:
            business._id,

          name,
          category,
          price,
          stock,
          description,

          image: req.file
            ? req.file.path
            : ""

        });

      await product.save();

      res.json({
        message:
          "Product created (public)",

        product
      });

    } catch (err) {

      console.error(
        "Public create error:"
      );

      console.error(err);

      res.status(500).json({
        error: err.message
      });

    }

  }
);

/* =========================
   PUBLIC GET PRODUCTS
========================= */
router.get(
  "/public/all",
  async (req, res) => {

    try {

      const products =
        await Product.find()
        .sort({
          createdAt: -1
        });

      res.json(products);

    } catch (err) {

      console.error(
        "Public products error:",
        err.message
      );

      res.status(500).json({
        message:
          "Failed to load products"
      });

    }

  }
);

module.exports = router;
