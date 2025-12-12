const User = require("../models/User");

// Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, businessId } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role: role || "staff",
      businessId: businessId || null
    });

    res.json({
      message: "User registered",
      token: user.getSignedToken(),
      user
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      token: user.getSignedToken(),
      user
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
};
