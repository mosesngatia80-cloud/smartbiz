const mongoose = require("mongoose");
require("dotenv").config();

const Expense = require("./models/Expense");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const docs = await Expense.find({})
    .select("title category quantity product amount")
    .sort({ createdAt: -1 })
    .limit(20);

  console.log(JSON.stringify(docs, null, 2));

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
