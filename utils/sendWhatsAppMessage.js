const axios = require("axios");

module.exports = async function sendWhatsAppMessage(phone, message) {
  if (!phone || !message) {
    console.warn("⚠️ WhatsApp skipped: missing phone or message");
    return;
  }

  if (!process.env.WHATSAPP_TOKEN || !process.env.PHONE_NUMBER_ID) {
    console.warn("⚠️ WhatsApp env vars missing");
    return;
  }

  const url = `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`;

  try {
    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📲 WhatsApp sent to", phone);
  } catch (err) {
    console.error(
      "❌ WhatsApp send failed:",
      err.response?.data || err.message
    );
  }
};
