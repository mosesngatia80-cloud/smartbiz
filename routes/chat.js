const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

/* ================= SEND MESSAGE ================= */
router.post("/send", async (req, res) => {
  try {
    const { businessId, sender, message } = req.body;

    if (!businessId || !sender || !message) {
      return res.status(400).json({
        message: "businessId, sender, message required"
      });
    }

    const newMsg = await Message.create({
      businessId,
      sender,
      message
    });

    res.status(201).json(newMsg);

  } catch (err) {
    res.status(500).json({
      message: "Failed to send message"
    });
  }
});

/* ================= GET CHAT HISTORY ================= */
router.get("/:businessId", async (req, res) => {
  try {
    const messages = await Message.find({
      businessId: req.params.businessId
    }).sort({ createdAt: 1 });

    res.json(messages);

  } catch (err) {
    res.status(500).json({
      message: "Failed to load messages"
    });
  }
});

module.exports = router;
