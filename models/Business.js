import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one business per user for MVP
    },
    phone: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: "",
    },

    // 🔑 Smart Pay wallet ID
    walletId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Business", businessSchema);
