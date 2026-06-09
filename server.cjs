require("dotenv").config();

const express = require("express");
const fetch = global.fetch;

const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(express.text({ type: "*/*" }));

/* =========================
   DEBUG LOGGER
========================= */
app.use((req, res, next) => {

  console.log(
    "🔥 INCOMING:",
    req.method,
    req.url
  );

  next();
});

/* =========================
   ENV
========================= */

const WHATSAPP_API_URL =
  "https://graph.facebook.com/v18.0";

const PHONE_NUMBER_ID =
  process.env.PHONE_NUMBER_ID;

const WHATSAPP_TOKEN =
  process.env.WHATSAPP_TOKEN;

const VERIFY_TOKEN =
  process.env.VERIFY_TOKEN;

const SMART_BIZ_BASE =
  process.env.SMARTPAY_BASE_URL;

const INTERNAL_KEY =
  process.env.CT_INTERNAL_KEY;

/* =========================
   SESSION
========================= */

const sessions = {};

/* =========================
   HELPERS
========================= */

async function sendWhatsAppMessage(
  to,
  text
) {

  const url =
    `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;

  const payload = {

    messaging_product:
      "whatsapp",

    to,

    type: "text",

    text: {
      body: text
    }
  };

  const resp = await fetch(
    url,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${WHATSAPP_TOKEN}`,

        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(payload)
    }
  );

  const data =
    await resp.json();

  console.log(
    "📤 WhatsApp response:",
    data
  );
}

function parseOrder(text) {

  const parts =
    text.split(" ");

  if (
    parts[0] === "buy" &&
    parts.length >= 3
  ) {

    const qty =
      parseInt(
        parts[
          parts.length - 1
        ]
      );

    const productName =
      parts
      .slice(1, -1)
      .join(" ");

    if (!isNaN(qty)) {

      return {
        productName,
        qty
      };
    }
  }

  return null;
}

/* =========================
   ROOT
========================= */

app.get("/", (req, res) => {

  res.send(
    "Smart Connect running"
  );
});

/* =========================
   WEBHOOK VERIFY
========================= */

app.get("/webhook", (req, res) => {

  const mode =
    req.query["hub.mode"];

  const token =
    req.query["hub.verify_token"];

  const challenge =
    req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {

    console.log(
      "✅ Webhook verified"
    );

    return res
      .status(200)
      .send(challenge);
  }

  return res.sendStatus(403);
});

/* =========================
   MAIN WEBHOOK
========================= */

app.post(
  "/webhook",
  async (req, res) => {

  try {

    console.log(
      JSON.stringify(
        req.body,
        null,
        2
      )
    );

    const message =
      req.body?.entry?.[0]
      ?.changes?.[0]
      ?.value?.messages?.[0];

    if (
      !message?.text?.body
    ) {

      return res.sendStatus(200);
    }

    const from =
      message.from;

    const text =
      message.text.body
      .trim()
      .toLowerCase();

    if (!sessions[from]) {

      sessions[from] = {
        businessId: null
      };
    }

    /* =========================
       DIRECT SHOW PRODUCTS
    ========================= */

    if (
      text ===
      "show products"
    ) {

      const bizResp =
        await fetch(
          `${SMART_BIZ_BASE}/api/business`
        );

      const businesses =
        await bizResp.json();

      if (
        !businesses.length
      ) {

        await sendWhatsAppMessage(
          from,
          "❌ No businesses found"
        );

        return res.sendStatus(200);
      }

      const business =
        businesses[0];

      sessions[from]
        .businessId =
          business._id;

      const resp =
        await fetch(
          `${SMART_BIZ_BASE}/api/products/my-products?businessId=${business._id}`
        );

      const products =
        await resp.json();

      if (
        !products.length
      ) {

        await sendWhatsAppMessage(
          from,
          "❌ No products available"
        );

        return res.sendStatus(200);
      }

      let reply =
        `🏪 ${business.name}\n\n`;

      reply +=
        "🛒 Available Products\n\n";

      products.forEach(
        (p, i) => {

        reply +=
          `${i + 1}. ${p.name} - KES ${p.price}\n`;
      });

      reply +=
        "\nUse:\nbuy product qty";

      await sendWhatsAppMessage(
        from,
        reply
      );

      return res.sendStatus(200);
    }

    /* =========================
       HANDLE ORDER
    ========================= */

    const parsed =
      parseOrder(text);

    if (parsed) {

      const businessId =
        sessions[from]
        .businessId;

      if (!businessId) {

        await sendWhatsAppMessage(
          from,
          "❌ First type:\nshow products"
        );

        return res.sendStatus(200);
      }

      const productResp =
        await fetch(
          `${SMART_BIZ_BASE}/api/products/search/by-name?name=${parsed.productName}&businessId=${businessId}`
        );

      const product =
        await productResp.json();

      if (
        !product ||
        !product._id
      ) {

        await sendWhatsAppMessage(
          from,
          "❌ Product not found"
        );

        return res.sendStatus(200);
      }

      const orderResp =
        await fetch(
          `${SMART_BIZ_BASE}/api/internal-secure/orders`,
          {

          method: "POST",

          headers: {
            "x-internal-key":
              INTERNAL_KEY,

            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

            business:
              product.business,

            items: [
              {
                productId:
                  product._id,

                qty:
                  parsed.qty
              }
            ]
          })
        });

      const orderData =
        await orderResp.json();

      if (
        orderData.payment
        ?.status === "PAID"
      ) {

        await sendWhatsAppMessage(
          from,
          `✅ Payment Successful

🛒 ${product.name} x${parsed.qty}

💰 KES ${orderData.order.total}`
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
       DEFAULT MESSAGE
    ========================= */

    await sendWhatsAppMessage(
      from,
      "👋 Welcome to SmartBiz\n\nType:\nshow products"
    );

    return res.sendStatus(200);

  } catch (err) {

    console.error(
      "❌ Webhook error:",
      err
    );

    return res.sendStatus(200);
  }
});

/* =========================
   START
========================= */

const PORT =
  process.env.PORT || 3000;

server.listen(
  PORT,
  "0.0.0.0",
  () => {

  console.log(
    `🚀 Smart Connect running on port ${PORT}`
  );
});
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinRoom", (orderId) => {
    socket.join(orderId);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.orderId).emit("newMessage", {
      orderId: data.orderId,
      message: data.message,
      senderType: data.senderType || "BUSINESS"
    });
  });
});
