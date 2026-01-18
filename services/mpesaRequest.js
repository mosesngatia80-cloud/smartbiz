const axios = require("axios");
const {
  getMpesaToken,
  clearMpesaToken,
} = require("../utils/mpesaTokenManager");

async function mpesaRequest(config) {
  try {
    const token = await getMpesaToken();

    return await axios({
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    // If token expired mid-request, refresh & retry once
    if (err.response && err.response.status === 401) {
      clearMpesaToken();
      const newToken = await getMpesaToken();

      return await axios({
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }

    throw err;
  }
}

module.exports = mpesaRequest;
