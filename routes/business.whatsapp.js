const express = require("express");

const router = express.Router();

const Business =
  require("../models/Business");

const BusinessWhatsApp =
  require("../models/BusinessWhatsApp");

/* =========================
   LINK WHATSAPP NUMBER
========================= */

router.post(
  "/link",
  async (req, res) => {

  try {

    const {
      phone,
      businessId,
      phoneNumberId,
      wabaId
    } = req.body;

    const business =
      await Business.findById(
        businessId
      );

    if (!business) {

      return res.status(404)
      .json({
        message:
          "Business not found"
      });
    }

    const existing =
      await BusinessWhatsApp.findOne({
        whatsappNumber: phone
      });

    if (existing) {

      return res.status(400)
      .json({
        message:
          "Number already linked"
      });
    }

    const linked =
      await BusinessWhatsApp.create({

      business:
        business._id,

      businessName:
        business.name,

      whatsappNumber:
        phone,

      phoneNumberId:
        phoneNumberId || "",

      wabaId:
        wabaId || ""
    });

    res.json({

      message:
        "WhatsApp linked ✅",

      linked
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message:
        err.message
    });
  }
});

/* =========================
   GET BUSINESS BY NUMBER
========================= */

router.get(
  "/by-number",
  async (req, res) => {

  try {

    const { phone } =
      req.query;

    const linked =
      await BusinessWhatsApp
      .findOne({
        whatsappNumber: phone
      });

    if (!linked) {

      return res.status(404)
      .json({
        message:
          "No linked business"
      });
    }

    res.json(linked);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message:
        err.message
    });
  }
});

module.exports = router;
