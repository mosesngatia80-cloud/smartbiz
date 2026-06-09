const fs = require("fs");

let s = fs.readFileSync("app.js", "utf8");

const marker = "Download PDF";

const insert = `Download PDF
</button>

          <button
            onclick="openChat('\${order._id}')"
            class="add-cart-btn"
          >
            💬 Chat Customer
          </button>`;

s = s.replace(marker, insert);

fs.writeFileSync("app.js", s);

console.log("✅ Chat button added");
