const fs = require("fs");

let s = fs.readFileSync("app.js", "utf8");

const target = "    loadOrders();";

const replacement = `    await sendSystemOrderMessage(
orderId,
status
);

loadOrders();`;

s = s.replace(target, replacement);

fs.writeFileSync("app.js", s);

console.log("✅ System chat hook added");
