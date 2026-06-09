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

s = s.replace(target, replacement);

fs.writeFileSync("app.js", s);

console.log("✅ Chat button added");
