const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
{
orderId: {
type: mongoose.Schema.Types.ObjectId,
ref: "Order",
required: true,
},

senderId: {
type: mongoose.Schema.Types.ObjectId,
required: true,
},

senderType: {
type: String,
enum: ["customer", "merchant"],
required: true,
},

message: {
type: String,
required: true,
},
},
{
timestamps: true,
}
);

module.exports = mongoose.model("Chat", chatSchema);
