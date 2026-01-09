module.exports = (req, res, next) => {
  // ===== DEV MODE BYPASS =====
  if (process.env.NODE_ENV === "dev") {
    req.user = {
      id: "DEV_USER_ID",
      role: "admin",
      email: "dev@local.test"
    };
    return next();
  }

  // ===== NORMAL JWT AUTH (PRODUCTION) =====
  const jwt = require("jsonwebtoken");

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};
