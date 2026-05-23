const express = require("express");

const router = express.Router();

const Booking = require("../models/Booking");

const Service = require("../models/Service");

const auth = require("../middleware/auth");

/* =========================
   CREATE BOOKING
========================= */

router.post("/", async (req, res) => {

  try {

    const {
      serviceId,
      customerPhone,
      bookingDate,
      bookingTime,
      notes
    } = req.body;

    const service =
      await Service.findById(
        serviceId
      );

    if (!service) {

      return res.status(404).json({
        message:
          "Service not found"
      });
    }

    const booking =
      await Booking.create({

        service:
          service._id,

        business:
          service.business,

        customerPhone,

        bookingDate,

        bookingTime,

        notes:
          notes || ""
      });

    res.status(201).json(
      booking
    );

  } catch (err) {

    console.error(
      "CREATE BOOKING ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Failed to create booking"
    });
  }
});

/* =========================
   GET BUSINESS BOOKINGS
========================= */

router.get("/", auth, async (req, res) => {

  try {

    const bookings =
      await Booking.find({

        business:
          req.user.business

      })

      .populate("service")

      .sort({
        createdAt: -1
      });

    res.json(
      bookings
    );

  } catch (err) {

    console.error(
      "GET BOOKINGS ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Failed to load bookings"
    });
  }
});

module.exports = router;
