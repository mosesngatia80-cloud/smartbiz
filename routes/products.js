const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const Business = require("../models/Business");

const verifyToken =
  require("../middleware/authMiddleware");

const multer =
  require("multer");

const cloudinary =
  require("cloudinary").v2;

/* =========================
   CLOUDINARY CONFIG
========================= */
cloudinary.config({

  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME,

  api_key:
    process.env.CLOUDINARY_API_KEY,

  api_secret:
    process.env.CLOUDINARY_API_SECRET

});

/* =========================
   MEMORY STORAGE
========================= */
const storage =
  multer.memoryStorage();

const upload =
  multer({ storage });

/* =========================
   CLOUDINARY UPLOAD
========================= */
async function uploadToCloudinary(fileBuffer) {

  return new Promise(
    (resolve, reject) => {

      cloudinary.uploader.upload_stream(

        {
          folder:
            "navu-smartbiz-products"
        },

        (error, result) => {

          if (error) {
            reject(error);
          } else {
            resolve(result);
          }

        }

      )

      .end(fileBuffer);

    }
  );

}

/* =========================
   CREATE PRODUCT
========================= */
router.post(
  "/",

  upload.single("image"),

  async (req, res) => {

    try {

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

      let imageUrl = "";

      /* ✅ REAL CLOUDINARY */
      if (req.file) {

        const uploaded =
          await uploadToCloudinary(
            req.file.buffer
          );

        imageUrl =
          uploaded.secure_url;

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

          image:
            imageUrl

        });

      await product.save();

      res.json({
        message:
          "Product created",
        product
      });

    } catch (err) {

      console.error(
        "UPLOAD ERROR:"
      );

      console.error(err);

      res.status(500).json({
        error:
          err.message
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
          business:
            business._id
        })

        .sort({
          createdAt: -1
        });

      res.json(products);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          "Failed to load products"
      });

    }

  }
);

/* =========================
   DELETE PRODUCT
========================= */
router.delete(
  "/:id",

  async (req, res) => {

    try {

      await Product.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message:
          "Deleted"
      });

    } catch (err) {

      res.status(500).json({
        error:
          err.message
      });

    }

  }
);

module.exports = router;

/* =========================
   PUBLIC STORE PRODUCTS
========================= */
router.get(
  "/store/:whatsappNumber",

  async (req, res) => {

    try {

      const business =
        await Business.findOne({
          whatsappNumber:
            req.params.whatsappNumber
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
            business._id
        })

        .sort({
          createdAt: -1
        });

      res.json({
        business,
        products
      });

    } catch (err) {

      console.error(
        "STORE PRODUCTS ERROR:"
      );

      console.error(err);

      res.status(500).json({
        message:
          "Failed to load store"
      });

    }

  }
);


/* =========================
   PUBLIC STORE PRODUCTS
   (SLUG VERSION)
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
            business._id
        })

        .sort({
          createdAt: -1
        });

      res.json({
        business,
        products
      });

    } catch (err) {

      console.error(
        "STORE PRODUCTS ERROR:"
      );

      console.error(err);

      res.status(500).json({
        message:
          "Failed to load store"
      });

    }

  }
);


/* =========================
   CASH SALE
========================= */

router.post(
  "/cash-sale",

  async (req, res) => {

    try {

      const {
        productName,
        amount,
        quantity = 1,
        whatsappNumber
      } = req.body;

      if (
        !productName ||
        !whatsappNumber
      ) {

        return res.status(400).json({
          message:
            "Missing fields"
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

      const product =
        await Product.findOne({

          business:
            business._id,

          name: {
            $regex:
              new RegExp(
                "^" +
                productName +
                "$",
                "i"
              )
          }
        });

      if (!product) {

        return res.status(404).json({
          message:
            "Product not found"
        });
      }

      const expectedTotal =

        Number(product.price) *

        Number(quantity);

      if (

        Number(amount) !==
        Number(expectedTotal)

      ) {

        return res.status(400).json({

          message:
            `Incorrect amount. Expected KES ${expectedTotal}`
        });
      }

      if (
        product.stock <
        quantity
      ) {

        return res.status(400).json({
          message:
            "Insufficient stock"
        });
      }

      product.stock -=
        Number(quantity);

      await product.save();

      res.json({

        success: true,

        message:
          "Cash sale recorded ✅",

        remainingStock:
          product.stock
      });

    }

    catch (err) {

      console.error(
        "CASH SALE ERROR:"
      );

      console.error(err);

      res.status(500).json({
        message:
          err.message
      });
    }
  }
);

