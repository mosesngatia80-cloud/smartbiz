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

module.exports = router;
