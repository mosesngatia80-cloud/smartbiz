const mongoose = require("mongoose");

const BusinessSchema =
  new mongoose.Schema(

  {
    name: {
      type: String,
      required: true
    },

    /* ✅ STORE SLUG */

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },

    /* ✅ MAIN PHONE */

    phone: {
      type: String,
      default: ""
    },

    /* ✅ WHATSAPP LOGIN */

    whatsappNumber: {
      type: String,
      trim: true,
      index: true
    },

    /* ✅ TEMP FLEXIBLE OWNER */

    owner: {
      type: String,
      default: ""
    },

    walletId: {
      type:
        mongoose.Schema.Types.ObjectId,

      ref: "Wallet"
    },

    whatsappLink: {
      type: String,
      default: ""
    }
  },

  { timestamps: true }
);

/* =========================
   AUTO SLUG GENERATION
========================= */

BusinessSchema.pre(
  "save",

  function(next) {

  if (
    this.isModified("name")
  ) {

    this.slug =
      this.name

      .toLowerCase()

      .replace(/\s+/g, "-")

      .replace(
        /[^a-z0-9-]/g,
        ""
      );
  }

  next();
});

module.exports =
  mongoose.models.Business ||

  mongoose.model(
    "Business",
    BusinessSchema
  );
