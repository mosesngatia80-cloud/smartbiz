const mongoose = require("mongoose");
require("dotenv").config();

const Expense = require("./models/Expense");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const count =
    await Expense.countDocuments();

  console.log("Expense count:", count);

  const sample =
    await Expense.findOne();

  console.log("Sample:", sample);

  process.exit(0);
}

run().catch(console.error);
