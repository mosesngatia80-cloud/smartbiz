require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  console.log(await User.collection.indexes());

  process.exit(0);
})();
