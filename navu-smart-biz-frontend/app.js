const API_BASE = "https://navu-smart-biz-sbdh.onrender.com/api";
const SITE_BASE = "https://navu-smart-biz-sbdh.onrender.com";

/* ================= UTIL ================= */

function logout() {

  localStorage.removeItem("token");
  localStorage.removeItem("business");

  location.reload();

}

/* ================= APP ================= */

function showView(id) {

  document
    .querySelectorAll(".view")
    .forEach(v =>
      v.classList.add("hidden")
    );

  const el =
    document.getElementById(id);

  if (el) {
    el.classList.remove("hidden");
  }

  if (id === "dashboard") {
    loadDashboard();
  }

  if (id === "products") {
    loadProducts();
  }

  if (id === "orders") {
    loadOrders();
  }

  if (id === "expenses") {
    loadExpenses();
  }

  if (id === "debts") {
    loadDebts();
  }

  if (id === "profile") {
    loadBusinessProfile();
  }

}

/* ================= LOGIN ================= */

async function login() {

  const whatsapp =
    document
      .getElementById("whatsapp")
      .value
      .trim();

  const businessName =
    document
      .getElementById("businessName")
      .value
      .trim();

  if (
    !whatsapp ||
    !businessName
  ) {

    alert(
      "Enter WhatsApp and Business Name ⚠️"
    );

    return;

  }

  try {

    const res =
      await fetch(

        API_BASE +
        "/auth/login-whatsapp",

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              whatsappNumber:
                whatsapp,

              name:
                businessName

            })

        }

      );

    const data =
      await res.json();

    if (!res.ok) {

      alert(
        data.message ||
        "Login failed ❌"
      );

      return;

    }

    localStorage.setItem(
      "token",
      data.token
    );

    localStorage.setItem(
      "business",
      JSON.stringify(
        data.business
      )
    );

    document.getElementById(
      "authScreen"
    ).style.display = "none";

    document.getElementById(
      "app"
    ).style.display = "block";

    showView("dashboard");

  }

  catch (err) {

    console.error(err);

    alert(
      "Server error ❌"
    );

  }

}

/* ================= DASHBOARD ================= */

async function loadDashboard() {

  try {

    const business =
      JSON.parse(
        localStorage.getItem(
          "business"
        )
      );

    if (!business) return;

    const res =
      await fetch(

        API_BASE +
        "/dashboard/summary?whatsappNumber=" +

        encodeURIComponent(
          business.whatsappNumber
        )

      );

    const data =
      await res.json();

    if (!res.ok) return;

    document.getElementById(
      "totalSales"
    ).innerText =
      data.totalSales || 0;

    document.getElementById(
      "walletBalance"
    ).innerText =
      `KES ${data.walletBalance || 0}`;

    document.getElementById(
      "revenue"
    ).innerText =
      `KES ${data.revenue || 0}`;

    document.getElementById(
      "ordersCount"
    ).innerText =
      data.totalOrders || 0;

  }

  catch (err) {

    console.error(
      "Dashboard error:",
      err
    );

  }

}

/* ================= PRODUCTS ================= */

async function loadProducts() {

  const list =
    document.getElementById(
      "productsList"
    );

  if (!list) return;

  try {

    const business =
      JSON.parse(
        localStorage.getItem(
          "business"
        )
      );

    const res =
      await fetch(

        API_BASE +
        "/products/my-products?whatsappNumber=" +

        encodeURIComponent(
          business.whatsappNumber
        )

      );

    const products =
      await res.json();

    list.innerHTML = "";

    products.forEach(p => {

      const imageUrl =
        p.image
        ? p.image
        : "";

      list.innerHTML += `
        <li class="order-card">

          ${
            p.image
            ? `
              <img
                src="${imageUrl}"
                style="
                  width:100%;
                  max-height:200px;
                  object-fit:cover;
                  border-radius:12px;
                  margin-bottom:10px;
                "
              />
            `
            : ""
          }

          <div>
            <strong>${p.name}</strong>
          </div>

          <div>
            KES ${p.price}
          </div>

          <div>
            Stock: ${p.stock}
          </div>

        </li>
      `;

    });

  }

  catch (err) {

    console.error(err);

    list.innerHTML =
      "<li>Failed to load products</li>";

  }

}

/* ================= IMAGE PRODUCT UPLOAD ================= */

async function addProduct() {

  const msg =
    document.getElementById(
      "productMsg"
    );

  const business =
    JSON.parse(
      localStorage.getItem(
        "business"
      )
    );

  const name =
    document.getElementById(
      "newProductName"
    ).value;

  const price =
    Number(

      document.getElementById(
        "newProductPrice"
      ).value

    );

  const stock =
    Number(

      document.getElementById(
        "newProductStock"
      ).value

    );

  const image =
    document.getElementById(
      "productImage"
    ).files[0];

  try {

    const formData =
      new FormData();

    formData.append(
      "name",
      name
    );

    formData.append(
      "price",
      price
    );

    formData.append(
      "stock",
      stock
    );

    formData.append(
      "whatsappNumber",
      business.whatsappNumber
    );

    if (image) {

      formData.append(
        "image",
        image
      );

    }

    const res =
      await fetch(

        API_BASE +
        "/products",

        {
          method: "POST",
          body: formData
        }

      );

    const data =
      await res.json();

    console.log(data);

    if (!res.ok) {

      msg.innerText =
        data.error ||
        data.message ||
        "Upload failed ❌";

      return;

    }

    msg.innerText =
      "Product uploaded ✅";

    document.getElementById(
      "newProductName"
    ).value = "";

    document.getElementById(
      "newProductPrice"
    ).value = "";

    document.getElementById(
      "newProductStock"
    ).value = "";

    document.getElementById(
      "productImage"
    ).value = "";

    loadProducts();

  }

  catch (err) {

    console.error(err);

    msg.innerText =
      "Server error ❌";

  }

}
