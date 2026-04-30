module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token" });
  }

  // Handle both:
  // "Bearer xxx" OR just "xxx"
  let token;

  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    token = authHeader;
  }

  if (token !== process.env.CT_INTERNAL_KEY) {
    return res.status(401).json({ message: "Invalid service token" });
  }

  next();
};
