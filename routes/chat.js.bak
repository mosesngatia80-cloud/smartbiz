const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

router.post("/send", async (req, res) => {
try {
const chat = await Chat.create(req.body);
res.status(201).json(chat);
} catch (err) {
res.status(500).json({ error: err.message });
}
});

router.get("/:orderId", async (req, res) => {
try {
const chats = await Chat.find({
orderId: req.params.orderId,
}).sort({ createdAt: 1 });

res.json(chats);

} catch (err) {
res.status(500).json({ error: err.message });
}
});

module.exports = router;
