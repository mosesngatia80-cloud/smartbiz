const express = require("express");
const router = express.Router();

/**
 * WhatsApp is READ-ONLY for MVP
 * Orders are created via Vendor Dashboard / AI
 */
router.post("/message", async (req, res) => {
  return res.json({
    reply:
      "🛒 Orders are processed by the merchant.\n\n" +
      "You will receive payment confirmations and receipts here.\n\n" +
      "Thank you for shopping with us."
  });
});

module.exports = router;
