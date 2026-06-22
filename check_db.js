const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("Connected DB:",
    mongoose.connection.db.databaseName
  );

  const collections =
    await mongoose.connection.db
      .listCollections()
      .toArray();

  console.log(
    collections.map(c => c.name)
  );

  process.exit(0);
}

run().catch(console.error);
