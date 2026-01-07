const mongoose = require("mongoose");

const MONGO_URI = "mongodb+srv://afritest:AfriSmartPay123@afrismartpaycluster.jyab9fb.mongodb.net/smartbiz";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to DB");

  const Business = mongoose.model(
    "Business",
    new mongoose.Schema({}, { strict: false }),
    "businesses"
  );

  const businessId = new mongoose.Types.ObjectId("695df3df6c1a1398235568b9");
  const walletId = new mongoose.Types.ObjectId("66b1f0e9a9c9b4f2e8123456");

  const before = await Business.findOne({ _id: businessId });
  console.log("🔍 BEFORE UPDATE:", before);

  const result = await Business.updateOne(
    { _id: businessId },
    { $set: { walletId } }
  );

  console.log("✏️ UPDATE RESULT:", result);

  const after = await Business.findOne({ _id: businessId });
  console.log("✅ AFTER UPDATE:", after);

  await mongoose.disconnect();
}

run().catch(console.error);
