const express = require("express");

const router = express.Router();

const Booking = require("../models/Booking");

const Service = require("../models/Service");
const Business = require("../models/Business");
const Customer = require("../models/Customer");

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

    const business =
      await Business.findById(
        service.business
      );

    let customer =
      await Customer.findOne({

        business:
          service.business,

        phone:
          customerPhone
      });

    if (!customer) {

      customer =
        await Customer.create({

          owner:
            business?.owner || "",

          business:
            service.business,

          name:
            "Service Customer",

          phone:
            customerPhone
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
========================= */

router.get("/", auth, async (req, res) => {

  try {

    const business =
      await Business.findOne({

        owner:
          req.user.user
      });

    if (!business) {

      return res.status(404).json({
        message:
          "Business not found"
      });
    }

    const bookings =
      await Booking.find({

        business:
          business._id
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

/* =========================
   UPDATE BOOKING STATUS
========================= */

router.patch(
  "/:id/status",

  auth,

  async (req, res) => {

    try {

      const {
        status
      } = req.body;

      const booking =
        await Booking.findById(
          req.params.id
        );

      if (!booking) {

        return res.status(404).json({
          message:
            "Booking not found"
        });
      }

      booking.status =
        status;

      await booking.save();

      res.json({
        success: true,
        booking
      });

    } catch (err) {

      console.error(
        "UPDATE BOOKING STATUS ERROR:",
        err
      );

      res.status(500).json({
        message:
          "Failed to update booking"
      });
    }
  }
);


/* =========================
   CUSTOMER BOOKINGS
========================= */

router.get(
  "/customer/:phone",
  async (req, res) => {

    try {

      const bookings =
        await Booking.find({
          customerPhone:
            req.params.phone
        })
        .populate("service")
        .sort({
          createdAt: -1
        });

      res.json(bookings);

    } catch (err) {

      console.error(
        "CUSTOMER BOOKINGS ERROR:",
        err
      );

      res.status(500).json({
        message:
          "Failed to load bookings"
      });
    }
  }
);

module.exports = router;

