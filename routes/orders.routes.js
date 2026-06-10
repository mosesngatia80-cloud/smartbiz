const express = require("express");
const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const Business = require("../models/Business");
const Product = require("../models/Product");

const router = express.Router();

/**
 * 🔥 FINAL DEBUG AUTH (DO NOT GUESS ANYMORE)
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  console.log("🔥 AUTH HEADER:", authHeader);
  console.log("🔥 ENV JWT_SECRET:", process.env.JWT_SECRET);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const secrets = [
    process.env.JWT_SECRET,
    "navuSmartBizSecretKey2025",
    "smartbiz_secret_key",
    "smartbiz_secret"
  ];

  console.log("🔥 SECRETS BEING TESTED:", secrets);

  let decoded = null;
  let usedSecret = null;

  for (const secret of secrets) {
    try {
      decoded = jwt.verify(token, secret);
      usedSecret = secret;
      console.log("✅ JWT SUCCESS WITH:", secret);
      break;
    } catch (e) {
      console.log("❌ FAILED:", secret);
    }
  }

  if (!decoded) {
    console.log("🚨 FINAL RESULT: JWT REJECTED");
    return res.status(401).json({ message: "Unauthorized" });
  }

  console.log("✅ DECODED TOKEN:", decoded);

  req.userId = decoded.user || decoded.businessId || decoded.id;

  console.log("✅ USING USERID:", req.userId);

  next();
}

/* ================= GET ORDERS ================= */
router.get("/", auth, async (req, res) => {
  try {
    const business = await Business.findOne({
      owner: req.userId
    });

    console.log("🏢 BUSINESS FOUND:", business);

    if (!business) return res.json([]);

    const orders = await Order.find({
      business: business._id
    }).sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed" });
  }
});

module.exports = router;
