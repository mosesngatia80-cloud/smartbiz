const fs = require("fs");

const file = "smartbiz.server.cjs";

let code = fs.readFileSync(file, "utf8");

if (
  !code.includes(
    'app.use("/uploads", express.static("uploads"));'
  )
) {

  code = code.replace(
    'app.use(express.json());',

`app.use(express.json());

app.use(
  "/uploads",
  express.static("uploads")
);`
  );

  fs.writeFileSync(file, code);

  console.log(
    "✅ uploads static route added"
  );

} else {

  console.log(
    "⚠️ uploads route already exists"
  );
}
