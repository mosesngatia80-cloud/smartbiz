const fetch = require("node-fetch");

const SMART_PAY_BASE_URL =
  process.env.SMART_PAY_URL || "http://localhost:4000";

/**
 * Credit wallet when order is PAID
 */
async function creditWallet({ businessId, amount, reference }) {
  const res = await fetch(`${SMART_PAY_BASE_URL}/api/wallet/credit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessId,
      amount,
      reference
    })
  });

  if (!res.ok) {
    throw new Error("Failed to credit wallet");
  }

  return res.json();
}

module.exports = {
  creditWallet
};
