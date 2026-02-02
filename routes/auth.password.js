const express = require("express");
const router = express.Router();

/**
 * PASSWORD RESET PLACEHOLDER
 * (Not implemented yet – prevents Render crash)
 */
router.post("/forgot-password", (req, res) => {
  res.status(501).json({
    message: "Password reset not implemented yet"
  });
});

module.exports = router;
