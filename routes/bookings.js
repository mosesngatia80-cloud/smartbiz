const express = require("express");

const router = express.Router();

const Booking = require("../models/Booking");

const Service = require("../models/Service");
const Business = require("../models/Business");
const Customer = require("../models/Customer");
const Debt = require("../models/Debt");

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

        servicePrice:
          service.price,

        notes:
          notes || ""
      });

    const io =
      req.app.get("io");

    if (io) {

      io.emit(
        "new_booking",
        booking
      );
    }

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
        err.message
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

      if (
        status === "COMPLETED" &&
        booking.paymentStatus !== "PAID"
      ) {

        const service =
          await Service.findById(
            booking.service
          );

        const existingDebt =
          await Debt.findOne({
            service: booking.service,
            customerPhone:
              booking.customerPhone,
            debtType: "SERVICE"
          });

        if (
          !existingDebt &&
          service
        ) {

          await Debt.create({
            business:
              booking.business,
            customerName:
              "Service Customer",
            customerPhone:
              booking.customerPhone,
            totalAmount:
              booking.servicePrice ||
              service.price,
            amountPaid: 0,
            balance:
              booking.servicePrice ||
              service.price,
            status: "UNPAID",
            debtType: "SERVICE",
            service:
              booking.service,
            note:
              "Created automatically from completed booking"
          });

        }
      }

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



/* =========================
   MARK BOOKING PAID
========================= */

router.patch(
  "/:id/payment",
  auth,
  async (req, res) => {

    try {

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

      booking.paymentStatus =
        "PAID";

      const debt =
        await Debt.findOne({
          service:
            booking.service,
          customerPhone:
            booking.customerPhone,
          debtType:
            "SERVICE"
        });

      if (debt) {

        debt.status =
          "PAID";

        debt.amountPaid =
          debt.totalAmount;

        debt.balance = 0;

        await debt.save();
      }

      await booking.save();

      res.json({
        success: true,
        booking
      });

    } catch (err) {

      console.error(
        "BOOKING PAYMENT ERROR:",
        err
      );

      res.status(500).json({
        message:
          "Failed to update payment"
      });
    }
  }
);


module.exports = router;

