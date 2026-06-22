const mongoose = require("mongoose");
require("dotenv").config();

const Expense = require("./models/Expense");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const result = await Expense.updateMany(
    {
      product: { $exists: true, $ne: null },
      quantity: { $gt: 0 },
      category: {
        $nin: ["INVENTORY_PURCHASE"]
      }
    },
    {
      $set: {
        category: "INVENTORY_PURCHASE"
      }
    }
  );

  console.log("Updated:", result.modifiedCount);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
