require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

console.log("🚀 Starting Smart Biz...");

/* =========================
MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());

app.use(
"/uploads",
express.static("uploads")
);

/* =========================
ROOT
========================= */

app.get("/", (req, res) => {

res.send(
"SMART BIZ API RUNNING"
);

});

/* =========================
ROUTES
========================= */

app.use(
"/api/products",
require("./routes/products")
);

app.use(
"/api/products",
require("./routes/products.public.fix")
);

app.use(
"/api/business",
require("./routes/business")
);

app.use(
"/api/business-whatsapp",
require("./routes/business.whatsapp")
);

app.use(
"/api/auth",
require("./routes/auth.whatsapp")
);

app.use(
"/api/orders",
require("./routes/orders")
);

app.use(
"/api/chat",
require("./routes/chat")
);

app.use(
"/api/services",
require("./routes/services")
);

app.use(
"/api/bookings",
require("./routes/bookings")
);

app.use(
"/api/receipts",
require("./routes/receipt.routes")
);

app.use(
"/api/wallet",
require("./routes/wallet")
);

app.use(
"/api/expense",
require("./routes/expense")
);

app.use(
"/api/debt",
require("./routes/debt")
);

app.use(
"/api/dashboard",
require("./routes/dashboard")
);

app.use(
"/api/internal-secure",
require("./routes/internal.orders")
);

app.use(
"/api/internal-secure",
require("./routes/internal.wallet.topup")
);

/* =========================
CONNECT DB
========================= */

console.log(
"🟡 Connecting to MongoDB..."
);

mongoose.connect(
process.env.MONGO_URI
)

.then(() => {

console.log(
"🟢 Smart Biz DB connected"
);

})

.catch(err => {

console.error(
"❌ MongoDB connection error:"
);

console.error(err);

});

/* =========================
START SERVER
========================= */

const PORT =
process.env.PORT || 3000;

app.listen(
PORT,
"0.0.0.0",
() => {

console.log(
  `🚀 Server started on port ${PORT}`
);

}
);

app.get("/deploy-check",(req,res)=>res.send("DEPLOY-127312d"));
