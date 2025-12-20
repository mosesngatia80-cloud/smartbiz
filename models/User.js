import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    password: {
      type: String,
      required: true
    },

    // 🔑 THIS WAS MISSING
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
