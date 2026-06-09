const express = require("express");
const router = express.Router();

const Chat = require("../models/Chat");
const auth = require("../middleware/auth");

router.post("/send", auth, async (req, res) => {
try {

const { orderId, message } = req.body;

if (!orderId || !message) {
  return res.status(400).json({
    error: "orderId and message required"
  });
}

const chat = await Chat.create({
  orderId,
  message,
  senderId: req.user.user,
  senderType: "merchant"
});

res.status(201).json(chat);

} catch (err) {

res.status(500).json({
  error: err.message
});

}
});

router.get("/:orderId", auth, async (req, res) => {
try {

const chats = await Chat.find({
  orderId: req.params.orderId
}).sort({
  createdAt: 1
});

res.json(chats);

} catch (err) {

res.status(500).json({
  error: err.message
});

}
});

module.exports = router;
