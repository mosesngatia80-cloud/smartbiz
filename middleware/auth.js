const jwt = require("jsonwebtoken");
const User = require("../models/User");

/*
  JWT Authentication Middleware
  - Verifies token
  - Loads FULL user from DB
  - Attaches active business from JWT
*/

// ✅ SINGLE SOURCE OF TRUTH FOR JWT SECRET
const JWT_SECRET = process.env.JWT_SECRET || "navuSmartBizSecretKey2025";

module.exports = async function (req, res, next) {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({
      message: "No token, authorization denied"
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      message: "Invalid token format"
    });
  }

  const token = parts[1];

  try {
    // 🔐 VERIFY TOKEN
    const decoded = jwt.verify(token, JWT_SECRET);

    // 🔎 Load user from DB
    const user = await User.findById(decoded.user).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    // 🔥 Attach user + business context
    req.user = {
      ...user.toObject(),
      business: decoded.business || null
    };

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({
      message: "Token is not valid"
    });
  }
};
