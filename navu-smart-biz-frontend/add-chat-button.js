const fs = require("fs");

let s = fs.readFileSync("app.js", "utf8");

const target = "            <button onclick="downloadReceipt('\${order._id}')" class="add-cart-btn" > Download PDF </button>";

const replacement = `            <button
onclick="downloadReceipt('\${order._id}')"
class="add-cart-btn"
>
Download PDF
</button>

        <button
          onclick="openChat('\${order._id}')"
          class="add-cart-btn"
        >
          💬 Chat Customer
        </button>`;

if (!s.includes(target)) {
console.log("❌ Target block not found");
process.exit(1);
}

s = s.replace(target, replacement);

fs.writeFileSync("app.js", s);

console.log("✅ Chat button added");
