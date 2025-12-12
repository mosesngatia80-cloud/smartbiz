const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // USER ROLES: admin, cashier, staff
  role: {
    type: String,
    enum: ["admin", "cashier", "staff"],
    default: "staff"
  },

  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Business"
  }
});

// Encrypt password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// JWT Token
userSchema.methods.getSignedToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, businessId: this.businessId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
