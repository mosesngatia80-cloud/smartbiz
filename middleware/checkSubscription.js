const Subscription =
  require("../models/Subscription");

const Business =
  require("../models/Business");

module.exports =
  async (req, res, next) => {

    try {

      let businessId =
        req.business?._id ||
        req.body.business ||
        req.query.business;

      if (
        !businessId &&
        req.query.whatsappNumber
      ) {

        const business =
          await Business.findOne({
            whatsappNumber:
              req.query.whatsappNumber
          });

        if (business) {
          businessId =
            business._id;
        }

      }

      /* =========================
         BETA MODE
         DO NOT BLOCK ANY ACCOUNT
      ========================= */

      return next();

    } catch (err) {

      console.error(
        "Subscription middleware:",
        err
      );

      return next();

    }

  };
