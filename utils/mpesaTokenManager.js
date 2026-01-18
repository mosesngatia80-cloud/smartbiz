const axios = require("axios");

let accessToken = null;
let tokenExpiry = null;

async function generateMpesaToken() {
  const auth = Buffer.from(
    process.env.MPESA_CONSUMER_KEY + ":" + process.env.MPESA_CONSUMER_SECRET
  ).toString("base64");

  const response = await axios.get(
    process.env.MPESA_AUTH_URL,
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );

  accessToken = response.data.access_token;
  // Safaricom tokens are valid ~3600s
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

  return accessToken;
}

async function getMpesaToken() {
  if (!accessToken || Date.now() >= tokenExpiry) {
    return await generateMpesaToken();
  }
  return accessToken;
}

function clearMpesaToken() {
  accessToken = null;
  tokenExpiry = null;
}

module.exports = {
  getMpesaToken,
  clearMpesaToken,
};
