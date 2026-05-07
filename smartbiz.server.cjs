require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

console.log("🚀 Starting Smart Biz...");

app.use(cors());
app.use(express.json());

/* ================= ROOT ================= */

app.get("/", (req, res) => {
  res.send("SMART BIZ API RUNNING");
});

/* ================= ROUTES ================= */

app.use(
  "/api/products",
  require("./routes/products")
);

app.use(
  "/api/business",
  require("./routes/business")
);

app.use(
  "/api/orders",
  require("./routes/orders")
);

app.use(
  "/api/wallet",
  require("./routes/wallet")
);

app.use(
  "/api/auth",
  require("./routes/auth.whatsapp")
);

app.use(
  "/api/expense",
  require("./routes/expense")
);

app.use(
  "/api/profit",
  require("./routes/profit")
);

app.use(
  "/api/whatsapp-orders",
  require("./routes/whatsapp.orders")
);

app.use(
  "/api/internal-secure",
  require("./routes/internal.orders")
);

app.use(
  "/api/internal-secure",
  require("./routes/internal.wallet.topup")
);

/* ================= START SERVER ================= */

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    `🚀 Server started on port ${PORT}`
  );
});

/* ================= DB ================= */

console.log("🟡 Connecting to MongoDB...");

mongoose.connect(process.env.MONGO_URI)

.then(() => {

  console.log(
    "🟢 Smart Biz DB connected"
  );
})

.catch(err => {

  console.error(
    "❌ DB ERROR:",
    err.message
  );
});
