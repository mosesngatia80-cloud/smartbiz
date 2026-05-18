const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Business = require("../models/Business");
const BusinessWhatsApp =
  require("../models/BusinessWhatsApp");

/*
 🔐 LOGIN WITH WHATSAPP
*/
router.post("/login-whatsapp", async (req, res) => {

  try {

    const {
      whatsappNumber,
      name
    } = req.body;

    if (!whatsappNumber) {

      return res.status(400).json({
        message: "WhatsApp required"
      });
    }

    let business =
      await Business.findOne({
        whatsappNumber
      });

    // ✅ AUTO CREATE BUSINESS
    if (!business) {

      business =
        await Business.create({

          name:
            name || "My Business",

          whatsappNumber,

          owner:
            whatsappNumber
        });
    }

    /* =========================
       AUTO LINK WHATSAPP
    ========================= */

    let linked =
      await BusinessWhatsApp.findOne({
        whatsappNumber
      });

    if (!linked) {

      linked =
        await BusinessWhatsApp.create({

          business:
            business._id,

          businessName:
            business.name,

          whatsappNumber,

          phoneNumberId:
            "AUTO_LINKED",

          wabaId:
            "AUTO_LINKED",

          active: true
        });

      console.log(
        "✅ Auto WhatsApp linked:",
        whatsappNumber
      );
    }

    // 🔐 SIMPLE TOKEN

    const token =
      jwt.sign(

        {
          user:
            business.owner
        },

        process.env.JWT_SECRET ||
        "smartbiz_secret",

        {
          expiresIn: "7d"
        }
      );

    res.json({
      token,
      business,
      linked
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Login failed"
    });
  }
});

module.exports = router;

/* ================= AUTO FIX OLD BUSINESS SLUG ================= */

router.post(
  "/fix-business-slug",
  async (req, res) => {

    try {

      const {
        whatsappNumber
      } = req.body;

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

      business.slug =

        (business.name || "store")

        .toLowerCase()

        .replace(/\s+/g, "-")

        .replace(/[^a-z0-9-]/g, "");

      await business.save();

      res.json({

        message:
          "Business slug fixed ✅",

        slug:
          business.slug
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

