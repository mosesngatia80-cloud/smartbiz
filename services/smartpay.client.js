const fetch = global.fetch;

async function payOrderViaWallet({ orderId, amount }) {
  const res = await fetch(`${process.env.SMARTPAY_BASE_URL}/api/payments/wallet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.SMARTCONNECT_INTERNAL_KEY
    },
    body: JSON.stringify({
      orderId,
      amount,
      source: "SMART_CONNECT",
      channel: "WHATSAPP"
    })
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t);
  }
  return res.json();
}

module.exports = { payOrderViaWallet };
