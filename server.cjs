require("dotenv").config();

const express = require("express");
const fetch = global.fetch;

const app = express();
app.use(express.json());
app.use(express.text({ type: "*/*" }));

/* =========================
   DEBUG LOGGER
========================= */
app.use((req, res, next) => {
  console.log("🔥 INCOMING:", req.method, req.url);
  next();
});

/* =========================
   ENV
========================= */
const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const SMART_BIZ_BASE = process.env.SMARTPAY_BASE_URL;
const INTERNAL_KEY = process.env.CT_INTERNAL_KEY;

/* =========================
   SESSION (TEMP IN-MEMORY)
========================= */
const sessions = {};

/* =========================
   HELPERS
========================= */
async function sendWhatsAppMessage(to, text) {
  const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text }
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await resp.json();
  console.log("📤 WhatsApp response:", data);
}

function parseOrder(text) {
  const parts = text.split(" ");
  if (parts[0] === "buy" && parts.length >= 3) {
    const qty = parseInt(parts[parts.length - 1]);
    const productName = parts.slice(1, -1).join(" ");
    if (!isNaN(qty)) {
      return { productName, qty };
    }
  }
  return null;
}

/* =========================
   ROOT
========================= */
app.get("/", (req, res) => {
  res.send("Smart Connect running");
});

/* =========================
   WEBHOOK VERIFY
========================= */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/* =========================
   MAIN WEBHOOK
========================= */
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message?.text?.body) return res.sendStatus(200);

    const from = message.from;
    const text = message.text.body.trim().toLowerCase();

    if (!sessions[from]) {
      sessions[from] = { mode: null, businessId: null };
    }

    /* =========================
       STEP 1: MODE SELECT
    ========================= */
    if (!sessions[from].mode) {
      if (text === "business") {
        sessions[from].mode = "BUSINESS";
        await sendWhatsAppMessage(from, "🏪 Business mode activated");
        return res.sendStatus(200);
      }

      if (text === "customer") {
        sessions[from].mode = "CUSTOMER";
        await sendWhatsAppMessage(from, "🛒 Customer mode activated\nType shop name");
        return res.sendStatus(200);
      }

      await sendWhatsAppMessage(
        from,
        "👋 Welcome!\n\nReply:\n• BUSINESS\n• CUSTOMER"
      );
      return res.sendStatus(200);
    }

    /* =========================
       CUSTOMER FLOW
    ========================= */
    if (sessions[from].mode === "CUSTOMER") {

      // select business
      if (!sessions[from].businessId) {
        const bizResp = await fetch(
          `${SMART_BIZ_BASE}/api/business/search?name=${text}`
        );
        const biz = await bizResp.json();

        if (!biz || !biz._id) {
          await sendWhatsAppMessage(from, "❌ Business not found");
          return res.sendStatus(200);
        }

        sessions[from].businessId = biz._id;

        await sendWhatsAppMessage(
          from,
          `🏪 Selected: ${biz.name}\n\nNow type: buy sugar 1`
        );

        return res.sendStatus(200);
      }

      // handle order
      const parsed = parseOrder(text);
      if (!parsed) {
        await sendWhatsAppMessage(from, "❓ Use: buy sugar 1");
        return res.sendStatus(200);
      }

      const businessId = sessions[from].businessId;

      const productResp = await fetch(
        `${SMART_BIZ_BASE}/api/products/search/by-name?name=${parsed.productName}&businessId=${businessId}`
      );
      const product = await productResp.json();

      if (!product || !product._id) {
        await sendWhatsAppMessage(from, "❌ Product not found");
        return res.sendStatus(200);
      }

      const orderResp = await fetch(
        `${SMART_BIZ_BASE}/api/internal-secure/orders`,
        {
          method: "POST",
          headers: {
            "x-internal-key": INTERNAL_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            business: product.business,
            items: [{ productId: product._id, qty: parsed.qty }]
          })
        }
      );

      const orderData = await orderResp.json();

      if (orderData.payment?.status === "PAID") {
        await sendWhatsAppMessage(
          from,
          `✅ Payment Successful\n\n🛒 ${product.name} x${parsed.qty}\n💰 KES ${orderData.order.total}\n💼 Balance: ${orderData.payment.remainingBalance}`
        );
      } else {
        await sendWhatsAppMessage(
          from,
          `⚠️ Payment failed: ${orderData.payment?.reason || "Unknown"}`
        );
      }

      return res.sendStatus(200);
    }

    /* =========================
       BUSINESS FLOW
    ========================= */
    if (sessions[from].mode === "BUSINESS") {
      await sendWhatsAppMessage(
        from,
        "📊 Business tools coming next (add products, view sales)"
      );
      return res.sendStatus(200);
    }

    return res.sendStatus(200);

  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.sendStatus(200);
  }
});

/* =========================
   START
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Smart Connect running on port ${PORT}`);
});
