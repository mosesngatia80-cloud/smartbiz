const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
      businessName,
      password
    } = req.body;

    if (!whatsappNumber) {

      return res.status(400).json({
        message: "WhatsApp required"
      });
    }

    if (!businessName) {

      return res.status(400).json({
        message: "Business name required"
      });
    }

    let business =
      await Business.findOne({
        whatsappNumber
      });

    if (business && business.password) {

      const validPassword =
        await bcrypt.compare(
          password || "",
          business.password
        );

      if (!validPassword) {

        return res.status(401).json({
          message: "Invalid password"
        });
      }
    }

    // ✅ AUTO CREATE BUSINESS
    if (!business) {

      business =
        await Business.create({

          name:
            businessName,

          whatsappNumber,

          owner:
            whatsappNumber,

          password:
            await bcrypt.hash(
              password || "123456",
              10
            )
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
      success: true,
      token,
      business
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;

