const express = require("express");
const router = express.Router();

const Subscription =
  require("../models/Subscription");

/* =========================
   CREATE SUBSCRIPTION
========================= */

router.post(
  "/create",
  async (req, res) => {

    try {

      const {
        business,
        plan,
        amount
      } = req.body;

      const subscription =
        await Subscription.create({
          business,
          plan,
          amount,
          status: "PENDING"
        });

      res.json({
        success: true,
        subscription
      });

    } catch (err) {

      res.status(500).json({
        message: err.message
      });

    }

  }
);

/* =========================
   CHECK STATUS
========================= */

router.get(
  "/status/:businessId",
  async (req, res) => {

    try {

      const subscription =
        await Subscription.findOne({
          business:
            req.params.businessId
        });

      res.json(subscription);

    } catch (err) {

      res.status(500).json({
        message: err.message
      });

    }

  }
);


router.post(
  "/activate/:id",
  async (req, res) => {

    try {

      const subscription =
        await Subscription.findById(
          req.params.id
        );

      if (!subscription) {
        return res.status(404).json({
          message:
            "Subscription not found"
        });
      }

      subscription.status =
        "ACTIVE";

      subscription.startDate =
        new Date();

      subscription.expiryDate =
        new Date(
          Date.now() +
          (30 * 24 * 60 * 60 * 1000)
        );

      subscription.graceUntil =
        new Date(
          subscription.expiryDate.getTime() +
          (2 * 24 * 60 * 60 * 1000)
        );

      await subscription.save();

      res.json({
        success: true,
        subscription
      });

    } catch (err) {

      res.status(500).json({
        message:
          err.message
      });

    }

  }
);

module.exports = router;

