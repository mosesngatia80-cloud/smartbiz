
require("../smartbiz.server.cjs");

const Business = require("../models/Business");
const Wallet = require("../models/Wallet");

(async () => {
  try {
    const businesses = await Business.find();

    for (const business of businesses) {
      const exists = await Wallet.findOne({
        owner: business._id,
        ownerType: "BUSINESS"
      });

      if (!exists) {
        await Wallet.create({
          owner: business._id,
          ownerType: "BUSINESS",
          balance: 0,
          currency: "KES"
        });

        console.log("✅ Created BUSINESS wallet:", business.name);
      } else {
        console.log("✔ Already has BUSINESS wallet:", business.name);
      }
    }

    console.log("🎉 Migration complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
