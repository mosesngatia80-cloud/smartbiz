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

  socket.on("join_room", async (orderId) => {
    console.log("JOIN_ROOM:", orderId);

    socket.join(orderId);

    const history = await Message.find({ orderId }).sort({ createdAt: 1 });

    console.log("HISTORY_COUNT:", history.length);

    socket.emit("chat_history", history);
  });

  socket.on("send_message", async (data) => {
    console.log("SEND_MESSAGE:", data);

    try {
      const msg = await Message.create(data);

      console.log("MESSAGE_SAVED:", msg._id);

      io.to(data.orderId).emit("receive_message", msg);

    } catch (err) {
      console.error("Socket error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

/* ================= ROUTES ================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auth", require("./routes/auth.whatsapp"));

app.use("/api/products", require("./routes/products"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/products", require("./routes/products.public.fix"));

/* ================= ORDERS FIX ================= */
/**
 * 🔥 FIX: use correct unified orders system
 * (DO NOT use order.routes.js anymore)
 */
app.use("/api/orders", require("./routes/orders.routes"));

app.use("/api/business", require("./routes/business"));
app.use("/api/business", require("./routes/business.routes"));
app.use("/api/business-whatsapp", require("./routes/business.whatsapp"));

app.use("/api/chat", require("./routes/chat"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/customer", require("./routes/customer"));

app.use("/api/services", require("./routes/services"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/dashboard", require("./routes/dashboard"));

app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/internal-wallet", require("./routes/internal.wallet"));
app.use("/api/internal-wallet-topup", require("./routes/internal.wallet.topup"));

app.use("/api/expense", require("./routes/expense"));
app.use("/api/debt", require("./routes/debt"));
app.use("/api/income", require("./routes/income"));

app.use("/api/reports", require("./routes/reports"));
app.use("/api/revenue", require("./routes/revenue.routes"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/sale", require("./routes/saleRoutes"));

app.use("/api/receipt", require("./routes/receipt.routes"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/payments-wallet", require("./routes/payments.wallet.routes"));

app.use("/api/ai", require("./routes/ai"));
app.use("/api/alerts", require("./routes/alerts"));

app.use("/api/internal", require("./routes/internal.orders"));
app.use("/api/internal-pos", require("./routes/internal.pos"));
app.use("/api/internal-register", require("./routes/internal.register"));

app.use("/api/whatsapp-orders", require("./routes/whatsapp.orders"));
app.use("/api/mpesa", require("./routes/mpesa"));
app.use("/api/smartpay-webhook", require("./routes/smartpay.webhook"));

/* ================= DB ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 Smart Biz DB connected"))
  .catch(err => console.error("DB error:", err));

/* ================= START ================= */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Smart Biz running on port ${PORT}`);
});
