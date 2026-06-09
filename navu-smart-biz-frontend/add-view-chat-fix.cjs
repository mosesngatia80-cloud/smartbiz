const fs = require("fs");

let s = fs.readFileSync("app.js","utf8");

const oldText = `          <button
            onclick="openChat('\${order._id}')"
            class="add-cart-btn"
          >
            💬 Chat Customer
          </button>
            </button>`;

const newText = `          <button
            onclick="openChat('\${order._id}')"
            class="add-cart-btn"
          >
            💬 Chat Customer
          </button>

          <button
            onclick="viewChat('\${order._id}')"
            class="add-cart-btn"
          >
            📜 View Chat
          </button>`;

s = s.replace(oldText, newText);

fs.writeFileSync("app.js", s);

console.log("✅ View Chat button added");
