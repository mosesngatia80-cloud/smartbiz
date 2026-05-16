const express = require("express");

const router = express.Router();

const Business = require("../models/Business");

/* =========================
   GET ALL BUSINESSES
========================= */

router.get("/", async (req, res) => {

  try {

    const businesses =
      await Business.find()
      .sort({ createdAt: -1 });

    res.json(businesses);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});

/* =========================
   SEARCH BUSINESS
========================= */

router.get("/search", async (req, res) => {

  try {

    const name =
      req.query.name;

    const business =
      await Business.findOne({
        name: new RegExp(name, "i")
      });

    if (!business) {

      return res.status(404)
      .json({
        message:
          "Business not found"
      });
    }

    res.json(business);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});


/* =========================
   CREATE / UPDATE SLUG
========================= */

router.post(
  "/create-slug",
  async (req, res) => {

  try {

    const {
      whatsappNumber,
      slug
    } = req.body;

    if (
      !whatsappNumber ||
      !slug
    ) {

      return res.status(400).json({
        message:
          "WhatsApp number and slug required"
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

    business.slug =
      slug
        .toLowerCase()
        .trim();

    await business.save();

    res.json({

      message:
        "Slug saved ✅",

      slug:
        business.slug,

      business
    });

  } catch (err) {

    console.error(
      "CREATE SLUG ERROR:",
      err
    );

    res.status(500).json({
      message:
        err.message
    });
  }
});


/* =========================
   GENERATE STORE LINK
========================= */

router.get(
  "/store-link/:slug",

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

    const storeLink =

      `https://your-netlify-site.netlify.app/?store=${business.slug}`;

    res.json({

      business:
        business.name,

      slug:
        business.slug,

      storeLink
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({

      message:
        err.message
    });
  }
});

module.exports = router;
