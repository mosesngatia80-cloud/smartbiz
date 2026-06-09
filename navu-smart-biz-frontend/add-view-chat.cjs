const fs = require("fs");

let s = fs.readFileSync("app.js", "utf8");

const target = `            💬 Chat Customer
          </button>`;

const replacement = `            💬 Chat Customer
          </button>

          <button
            onclick="viewChat('\${order._id}')"
            class="add-cart-btn"
          >
            📜 View Chat
          </button>`;

if (!s.includes(target)) {
  console.log("❌ Target not found");
  process.exit(1);
}

s = s.replace(target, replacement);

fs.writeFileSync("app.js", s);

console.log("✅ View Chat button added");
