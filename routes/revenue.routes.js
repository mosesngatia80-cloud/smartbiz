const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

// safe placeholder
router.get("/", auth, (req, res) => {
  res.json({ message: "Revenue module working (stub)" });
});

module.exports = router;
