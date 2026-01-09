function formatBrandedWhatsAppReceipt({
  businessName = "NAVUFINTECH SYSTEMS",
  receiptId,
  productName,
  amount,
  transactionId,
  issuedAt
}) {
  return `
🧾 ${businessName.toUpperCase()}

Secure Digital Payments

Receipt ID: ${receiptId}

Item: ${productName}
Amount: KES ${amount}

Payment Method: M-PESA
Transaction ID: ${transactionId}
Status: PAID

Date: ${issuedAt}

If you have any questions, reply to this message.
Thank you for choosing ${businessName}.
`.trim();
}

module.exports = formatBrandedWhatsAppReceipt;
