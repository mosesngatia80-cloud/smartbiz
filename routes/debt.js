const express = require("express");

const router = express.Router();

const Debt = require("../models/Debt");
const Business = require("../models/Business");

/* =========================
   CREATE DEBT
========================= */

router.post(
  "/create",
  async (req, res) => {

  try {

    const {
      phone,
      customerName,
      customerPhone,
      totalAmount,
      amountPaid,
      note
    } = req.body;

    const business =
      await Business.findOne({
        phone
      });

    if (!business) {

      return res.status(404)
      .json({
        message:
          "Business not found"
      });
    }

    const balance =
      Number(totalAmount) -
      Number(amountPaid || 0);

    let status =
      "UNPAID";

    if (
      amountPaid > 0 &&
      balance > 0
    ) {

      status = "PARTIAL";
    }

    if (balance <= 0) {

      status = "PAID";
    }

    const debt =
      await Debt.create({

      business:
        business._id,

      customerName,

      customerPhone,

      totalAmount,

      amountPaid:
        amountPaid || 0,

      balance,

      status,

      note
    });

    res.json({
      message:
        "Debt created ✅",

      debt
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
   GET DEBTS
========================= */

router.get(
  "/",
  async (req, res) => {

  try {

    const {
      phone
    } = req.query;

    const business =
      await Business.findOne({
        phone
      });

    if (!business) {

      return res.status(404)
      .json({
        message:
          "Business not found"
      });
    }

    const debts =
      await Debt.find({

      business:
        business._id

    }).sort({
      createdAt: -1
    });

    const totalDebt =
      debts.reduce(
        (sum, d) =>
          sum + d.balance,
        0
      );

    res.json({

      totalDebt,

      debts
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
