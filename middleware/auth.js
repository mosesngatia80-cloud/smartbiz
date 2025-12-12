const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function verifyToken(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "No token provided" });

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ message: "Invalid token (user not found)" });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired", error: err.message });
  }
}

module.exports = verifyToken;
