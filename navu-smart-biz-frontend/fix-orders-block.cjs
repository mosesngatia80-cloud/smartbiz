const fs = require("fs");

let s = fs.readFileSync("app.js", "utf8");

const bad = `  if (id === "orders") {
await sendSystemOrderMessage(
orderId,
status
);

loadOrders();
}`;

const good = "  if (id === "orders") { loadOrders(); }";

s = s.replace(bad, good);

fs.writeFileSync("app.js", s);

console.log("✅ Orders block fixed");
