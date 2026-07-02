const mongoose = require("mongoose");

const ConversationSessionSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      index: true
    },

    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true
    },

    businessSlug: {
      type: String,
      required: true
    },

    status: {
      type: String,
      default: "ACTIVE"
    },

    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "ConversationSession",
  ConversationSessionSchema
);
