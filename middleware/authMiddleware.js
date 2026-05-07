module.exports = (req, res, next) => {
  console.log("🔥 AUTH BYPASSED");

  req.user = {
    user: "DEV_USER",
    _id: "DEV_USER",
    business: "DEV_USER"
  };

  next();
};
