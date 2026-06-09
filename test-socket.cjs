const { io } = require("socket.io-client");

console.log("🚀 Connecting to Smart Biz...");

const socket = io("http://127.0.0.1:5001", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("🟢 Connected:", socket.id);

  socket.emit("join_room", "biz123");

  setTimeout(() => {
    socket.emit("send_message", {
      businessId: "biz123",
      sender: "client",
      message: "Hello Smart Biz 👋"
    });
  }, 1000);
});

socket.on("chat_history", (data) => {
  console.log("📜 History:", data);
});

socket.on("receive_message", (msg) => {
  console.log("📩 Live Message:", msg);
});

socket.on("connect_error", (err) => {
  console.log("❌ Connection error:", err.message);
});
