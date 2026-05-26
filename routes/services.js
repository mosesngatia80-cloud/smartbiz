const express = require("express");

const router = express.Router();

const Service = require("../models/Service");
const Business = require("../models/Business");

const auth = require("../middleware/auth");

/* =========================
   CREATE SERVICE
========================= */

router.post("/", auth, async (req, res) => {

  try {

    const business =
      await Business.findOne({

        owner:
          req.user.user
      });

    if (!business) {

      return res.status(400).json({
        message:
          "No business linked"
      });
    }

    const service =
      await Service.create({

        name:
          req.body.name,

        description:
          req.body.description || "",

        price:
          req.body.price,

        duration:
          req.body.duration || 30,

        image:
          req.body.image || "",

        business:
          business._id,

        owner:
          req.user.user
      });

    res.status(201).json(
      service
    );

  } catch (err) {

    console.error(
      "CREATE SERVICE ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Failed to create service"
    });
  }
});

/* =========================
   GET BUSINESS SERVICES
========================= */

router.get("/", auth, async (req, res) => {

  try {

    const business =
      await Business.findOne({

        owner:
          req.user.user
      });

    if (!business) {

      return res.status(400).json({
        message:
          "No business linked"
      });
    }

    const services =
      await Service.find({

        business:
          business._id

      }).sort({
        createdAt: -1
      });

    res.json(
      services
    );

  } catch (err) {

    console.error(
      "GET SERVICES ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Failed to load services"
    });
  }
});

module.exports = router;
