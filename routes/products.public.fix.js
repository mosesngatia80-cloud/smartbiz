
const express = require("express");

const router = express.Router();

const Product =
  require("../models/Product");

const Business =
  require("../models/Business");

/* =========================
   PUBLIC STORE FRONT
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

      return res
        .status(404)
        .json({

        message:
          "Business not found"
      });
    }

    const products =
      await Product.find({

      business:
        business._id,

      isActive: true
    })

    .sort({
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

    res.status(500)
      .json({

      message:
        err.message
    });
  }
});

/* =========================
   PUBLIC PRODUCT CREATE
========================= */

router.post(
  "/public/create",

  async (req, res) => {

  try {

    const {
      name,
      price,
      stock = 0,
      businessSlug
    } = req.body;

    if (
      !name ||
      price == null ||
      !businessSlug
    ) {

      return res
        .status(400)
        .json({

        message:
          "Missing fields"
      });
    }

    const business =
      await Business.findOne({

      slug:
        businessSlug
    });

    if (!business) {

      return res
        .status(404)
        .json({

        message:
          "Business not found"
      });
    }

    const product =
      await Product.create({

      name,

      price,

      stock,

      owner:
        business.owner,

      business:
        business._id,

      isActive: true
    });

    res.status(201)
      .json({

      message:
        "Product created",

      product
    });

  } catch (err) {

    console.error(
      "Public create error:",
      err
    );

    res.status(500)
      .json({

      message:
        err.message
    });
  }
});



/* =========================
   PUBLIC MARKETPLACE
========================= */

router.get("/public", async (req, res) => {

  try {

    const products = await Product.find({
      isActive: true
    })
    .populate("business", "name slug")
    .sort({ createdAt: -1 });

    res.json(products);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});


module.exports = router;

/* =========================
   FALLBACK STORE ROUTE
========================= */

router.get(
  "/store-fixed/:slug",

  async (req, res) => {

    try {

      const slug =
        req.params.slug;

      let business =
        await Business.findOne({
          slug
        });

      if (!business) {

        business =
          await Business.findOne({

            name: {
              $regex:
                new RegExp(
                  "^" +
                  slug.replace(/-/g, " ") +
                  "$",
                  "i"
                )
            }
          });
      }

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
        })

        .sort({
          createdAt: -1
        });

      res.json({

        business,
        products
      });

    }

    catch (err) {

      console.error(err);

      res.status(500).json({
        message:
          err.message
      });
    }
  }
);

