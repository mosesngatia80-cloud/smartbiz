const { io } = require("socket.io-client");

// Backend URL (local)
const socket = io("http://localhost:5001");

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  // Join a test room
  socket.emit("join_room", "biz123");

  // Send message after 2 seconds
  setTimeout(() => {
    socket.emit("send_message", {
      businessId: "biz123",
      message: "Hello from client 1",
      sender: "client1"
    });
  }, 2000);
});

// Listen for messages
socket.on("receive_message", (data) => {
  console.log("📩 Message received:", data);
});
