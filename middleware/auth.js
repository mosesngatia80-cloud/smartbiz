const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res.status(401).json({
        message: "No token provided"
      });
    }

    const token =
      authHeader.split(" ")[1];

    if (!token) {

      return res.status(401).json({
        message: "Invalid token"
      });
    }

    const decoded =
      jwt.verify(

        token,

        process.env.JWT_SECRET ||
        "smartbiz_secret"
      );

    req.user = decoded;

    next();

  } catch (err) {

    console.error(
      "AUTH ERROR:",
      err.message
    );

    res.status(401).json({
      message: "Unauthorized"
    });
  }
};
