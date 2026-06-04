const express = require("express");
const router = express.Router();

const Chat = require("../models/Chat");
const Order = require("../models/Order");
const auth = require("../middleware/auth");

/* =========================
MERCHANT SEND
========================= */

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
senderId: String(req.user.user),
senderType: "merchant"
});

res.status(201).json(chat);

} catch (err) {

res.status(500).json({
error: err.message
});

}
});

/* =========================
MERCHANT VIEW
========================= */

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

/* =========================
CUSTOMER SEND
========================= */

router.post("/customer/send", async (req, res) => {
try {

const {
orderId,
customerPhone,
message
} = req.body;

if (
!orderId ||
!customerPhone ||
!message
) {
return res.status(400).json({
error:
"orderId, customerPhone and message required"
});
}

const order =
await Order.findById(orderId);

if (!order) {
return res.status(404).json({
error: "Order not found"
});
}

if (
order.customerPhone !== customerPhone
) {
return res.status(403).json({
error: "Invalid customer"
});
}

const chat = await Chat.create({
orderId,
message,
senderId: customerPhone,
senderType: "customer"
});

res.status(201).json(chat);

} catch (err) {

res.status(500).json({
error: err.message
});

}
});

/* =========================
CUSTOMER VIEW
========================= */

router.post("/customer/view", async (req, res) => {
try {

const {
orderId,
customerPhone
} = req.body;

const order =
await Order.findById(orderId);

if (!order) {
return res.status(404).json({
error: "Order not found"
});
}

if (
order.customerPhone !== customerPhone
) {
return res.status(403).json({
error: "Invalid customer"
});
}

const chats = await Chat.find({
orderId
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
