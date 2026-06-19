const Subscription =
  require("../models/Subscription");

module.exports =
  async (req, res, next) => {

    try {

      const businessId =
        req.business?._id ||
        req.body.business ||
        req.query.business;

      if (!businessId) {
        return next();
      }

      const subscription =
        await Subscription.findOne({
          business: businessId
        });

      if (!subscription) {
        return res.status(403).json({
          success: false,
          message:
            "No active subscription"
        });
      }

      const now = new Date();

      if (
        subscription.expiryDate &&
        now > subscription.expiryDate &&
        now <= subscription.graceUntil
      ) {

        subscription.status =
          "GRACE";

        await subscription.save();

        req.subscriptionWarning =
          "Subscription expired. Grace period active.";

        return next();
      }

      if (
        subscription.graceUntil &&
        now > subscription.graceUntil
      ) {

        subscription.status =
          "SUSPENDED";

        await subscription.save();

        return res.status(403).json({
          success: false,
          message:
            "Subscription expired. Please renew."
        });
      }

      next();

    } catch (err) {

      res.status(500).json({
        message: err.message
      });

    }

  };
