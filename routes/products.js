const express = require("express");
const router = express.Router();

const upload =
  require("../cloudinaryStorage");

const Product =
  require("../models/Product");

const Business =
  require("../models/Business");

const Order =
  require("../models/Order");

const Wallet =
  require("../models/Wallet");

/* =========================
   CREATE PRODUCT
========================= */

router.post(
  "/create",

  upload.single("image"),

  async (req, res) => {

    try {

      const {
        name,
        price,
        stock = 0,
        whatsappNumber,
        unitType = "PIECE",
        allowFractions = false,
        pricePerUnit = 0
      } = req.body;

      if (
        !name ||
        price == null ||
        !whatsappNumber
      ) {

        return res.status(400).json({
          message: "Missing fields"
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

      const image =
        req.file
        ? req.file.path
        : "";

      const product =
        await Product.create({

          name,
          price,
          stock,
          image,

          unitType,
          allowFractions,
          pricePerUnit,

          owner:
            business.owner,

          business:
            business._id,

          isActive: true
        });

      res.json({
        message:
          "Product created",
        product
      });

    } catch (err) {

      console.error(
        "CREATE PRODUCT ERROR:",
        err
      );

      res.status(500).json({
        message:
          err.message
      });
    }
  }
);

/* =========================
   STORE PRODUCTS
========================= */

router.get(
  "/store/:slug",

  async (req, res) => {

    try {

      const business =
        await Business.findOne({
          slug:
            req.params.slug
        });

      if (!business) {

        return res.status(404).json({
          message:
            "Business not found"
        });
      }

      const products =
        await Product.find({

          business:
            business._id,

          isActive: true
        }).sort({
          createdAt: -1
        });

      res.json({
        business: {
          name:
            business.name,

          slug:
            business.slug,

          whatsappNumber:
            business.whatsappNumber
        },

        products
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          err.message
      });
    }
  }
);

/* =========================
   GET BUSINESS PRODUCTS
========================= */

router.get(
  "/my-products",

  async (req, res) => {

    try {

      const whatsappNumber =
        req.query.whatsappNumber;

      if (!whatsappNumber) {

        return res.status(400).json({
          message:
            "WhatsApp required"
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

          business:
            business._id,

          isActive: true
        }).sort({
          createdAt: -1
        });

      res.json(products);

    } catch (err) {

      console.error(
        "LOAD PRODUCTS ERROR:",
        err
      );

      res.status(500).json({
        message:
          err.message
      });
    }
  }
);

module.exports = router;
