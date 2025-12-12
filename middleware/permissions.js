exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only access" });
  }
  next();
};

exports.isCashier = (req, res, next) => {
  if (req.user.role !== "cashier" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Cashier only access" });
  }
  next();
};

exports.isStaff = (req, res, next) => {
  if (!["staff", "cashier", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Staff only access" });
  }
  next();
};
