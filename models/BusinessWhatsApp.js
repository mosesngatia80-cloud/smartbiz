const mongoose = require("mongoose");

const BusinessWhatsAppSchema =
  new mongoose.Schema(
    {
      business: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Business",
        required: true
      },

      businessName: {
        type: String,
        default: ""
      },

      whatsappNumber: {
        type: String,
        required: true,
        unique: true
      },

      phoneNumberId: {
        type: String,
        default: ""
      },

      wabaId: {
        type: String,
        default: ""
      },

      active: {
        type: Boolean,
        default: true
      }
    },
    { timestamps: true }
  );

module.exports =
  mongoose.models.BusinessWhatsApp ||
  mongoose.model(
    "BusinessWhatsApp",
    BusinessWhatsAppSchema
  );
