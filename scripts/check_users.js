require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to:", mongoose.connection.name);

    const users = await User.find(
      {},
      {
        whatsapp: 1,
        businessName: 1,
        email: 1
      }
    );

    console.log(JSON.stringify(users, null, 2));

    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
