/*
================================================
 DEPRECATED PAYMENTS ROUTE
------------------------------------------------
 This file previously handled:
   POST /api/payments/wallet

 That route has been MOVED to:
   routes/payments.wallet.routes.js

 Reason:
 - Avoid route collision
 - Separate ORDER payments from WALLET payments
 - Enable PIN security & B2C compatibility

 DO NOT add /wallet here again.
================================================
*/

const express = require("express");
const router = express.Router();

module.exports = router;
