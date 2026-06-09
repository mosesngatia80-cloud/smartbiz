require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= SOCKET.IO ================= */
const io = new Server(server, {
  cors: { origin: "*" }
});

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("join_room", async (businessId) => {
    socket.join(businessId);

    const history = await Message.find({ businessId }).sort({ createdAt: 1 });
    socket.emit("chat_history", history);
  });

  socket.on("send_message", async (data) => {
    try {
      const msg = await Message.create(data);
      io.to(data.businessId).emit("receive_message", msg);
    } catch (err) {
      console.error("Socket message error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

/* ================= ROUTES ================= */
app.use("/api/chat", require("./routes/chat"));

/* ================= DB ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 Smart Biz DB connected"))
  .catch(err => console.error("DB error:", err));

/* ================= START ================= */
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Smart Biz running on port ${PORT}`);
});
