require("dotenv").config();

const express = require("express");
const router = express.Router();
const sendWhatsAppMessage = require("../utils/sendWhatsAppMessage");

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

/* =========================
   WEBHOOK VERIFY
========================= */

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/* =========================
   META WEBHOOK
========================= */

router.post("/webhook", async (req, res) => {
  console.log("📩 META WEBHOOK HIT");

  try {

    const message =
      req.body?.entry?.[0]
      ?.changes?.[0]
      ?.value?.messages?.[0];

    if (!message?.text?.body) {
      return res.sendStatus(200);
    }

    const sender = message.from;
    console.log("📨 MESSAGE:", {
      sender,
      text: message.text.body
    });
    const text = message.text.body.trim().toLowerCase();

    const response = await fetch(
      "http://127.0.0.1:" +
      process.env.PORT +
      "/api/whatsapp-orders/message",
      {
        method: "POST",
        headers: {
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          sender,
          text
        })
      }
    );

    const result = await response.json();

    console.log("📤 GATEWAY RESPONSE:", result);

    await sendWhatsAppMessage(
      sender,
      result.reply || "❌ Unable to process request."
    );

    return res.sendStatus(200);

  } catch(err) {

    console.error(err);

    return res.sendStatus(200);
  }
});

module.exports = router;
