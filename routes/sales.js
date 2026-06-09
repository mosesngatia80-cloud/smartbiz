const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

// TEMP SAFE HANDLER (prevents crash)
router.post("/", auth, (req, res) => {
  res.json({
    message: "Sales route working (controller missing - stub mode)"
  });
});

module.exports = router;
