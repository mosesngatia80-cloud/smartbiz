const API_BASE = "https://navu-smart-biz-sbdh.onrender.com/api";

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
    .forEach(v => v.classList.add("hidden"));

  const el = document.getElementById(id);

  if (el) {
    el.classList.remove("hidden");
  }

  if (id === "dashboard") {
    loadDashboard();
  }

  if (id === "products") {
    loadProducts();
  }

  if (id === "profile") {
    loadBusinessProfile();
  }

  /* ✅ LOAD ORDERS */

  if (id === "orders") {
    loadOrders();
  }
}

/* ================= DASHBOARD ================= */

async function loadDashboard() {

  try {

    const business =
      JSON.parse(
        localStorage.getItem("business")
      );

    if (!business) {
      return;
    }

    const res = await fetch(

      API_BASE +

      "/dashboard/summary?whatsappNumber=" +

      encodeURIComponent(
        business.whatsappNumber
      )
    );

    const data = await res.json();

    if (!res.ok) {
      return;
    }

    document.getElementById(
      "totalSales"
    ).innerText =
      data.totalSales;

    document.getElementById(
      "walletBalance"
    ).innerText =
      `KES ${data.walletBalance}`;

    document.getElementById(
      "revenue"
    ).innerText =
      `KES ${data.revenue}`;

    document.getElementById(
      "expenses"
    ).innerText =
      `KES ${data.expenses}`;

    document.getElementById(
      "profit"
    ).innerText =
      `KES ${data.profit}`;

    document.getElementById(
      "ordersCount"
    ).innerText =
      data.totalOrders;

  } catch (err) {

    console.error(
      "Dashboard error:",
      err
    );
  }
}

/* ================= PROFILE ================= */

async function loadBusinessProfile() {

  try {

    const localBusiness =
      JSON.parse(
        localStorage.getItem("business")
      );

    if (localBusiness) {

      document.getElementById(
        "profileBusinessName"
      ).innerText =
        localBusiness.name || "-";

      document.getElementById(
        "profileWhatsapp"
      ).innerText =
        localBusiness.whatsappNumber || "-";
    }

    const res = await fetch(
      API_BASE + "/business/me"
    );

    const data = await res.json();

    if (!res.ok) {
      return;
    }

    const wallet =
      data.wallet;

    if (
      document.getElementById(
        "walletBalance"
      )
    ) {

      document.getElementById(
        "walletBalance"
      ).innerText =
        `KES ${wallet?.balance || 0}`;
    }

  } catch (err) {

    console.error(
      "Profile load error:",
      err
    );
  }
}

/* ================= LOGIN ================= */

async function login() {

  const whatsappEl =
    document.getElementById("whatsapp");

  const businessEl =
    document.getElementById("businessName");

  if (!whatsappEl || !businessEl) {

    alert("Login inputs missing ❌");

    return;
  }

  const whatsapp =
    whatsappEl.value.trim();

  const businessName =
    businessEl.value.trim();

  if (!whatsapp || !businessName) {

    alert(
      "Enter WhatsApp and Business Name ⚠️"
    );

    return;
  }

  try {

    const res = await fetch(
      API_BASE + "/auth/login-whatsapp",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          whatsappNumber: whatsapp,
          name: businessName
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {

      alert(
        data.message || "Login failed ❌"
      );

      return;
    }

    localStorage.setItem(
      "token",
      data.token
    );

    localStorage.setItem(
      "business",
      JSON.stringify(data.business)
    );

    document.getElementById(
      "authScreen"
    ).style.display = "none";

    document.getElementById(
      "app"
    ).style.display = "block";

    showView("dashboard");

  } catch (err) {

    console.error(err);

    alert("Server error ❌");
  }
}

/* ================= PRODUCTS ================= */

async function loadProducts() {

  const list =
    document.getElementById("productsList");

  if (!list) return;

  try {

    const business =
      JSON.parse(
        localStorage.getItem("business")
      );

    if (!business) {

      list.innerHTML =
        "<li>No business session</li>";

      return;
    }

    const res = await fetch(

      API_BASE +

      "/products/my-products?whatsappNumber=" +

      encodeURIComponent(
        business.whatsappNumber
      )
    );

    const products = await res.json();

    list.innerHTML = "";

    products.forEach(p => {

      list.innerHTML += `
        <li>
          ${p.name}
          —
          KES ${p.price}
          —
          Stock: ${p.stock}
          —
          Unit: ${p.unitType}
        </li>
      `;
    });

  } catch (err) {

    console.log(err);

    list.innerHTML =
      "<li>Failed to load products</li>";
  }
}

/* ================= ADD PRODUCT ================= */

async function addProduct() {

  const msg =
    document.getElementById("productMsg");

  const name =
    document.getElementById(
      "newProductName"
    ).value;

  const price = Number(
    document.getElementById(
      "newProductPrice"
    ).value
  );

  const stock = Number(
    document.getElementById(
      "newProductStock"
    ).value
  );

  const business =
    JSON.parse(
      localStorage.getItem("business")
    );

  if (!business) {

    msg.innerText =
      "No business session ❌";

    return;
  }

  if (!name || !price) {

    msg.innerText =
      "Enter name and price ⚠️";

    return;
  }

  msg.innerText = "Adding...";

  try {

    const res = await fetch(

      API_BASE + "/products/create",

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          name,
          price,
          stock,

          whatsappNumber:
            business.whatsappNumber
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {

      msg.innerText =
        data.message || "Failed ❌";

      return;
    }

    msg.innerText =
      "Product added ✅";

    document.getElementById(
      "newProductName"
    ).value = "";

    document.getElementById(
      "newProductPrice"
    ).value = "";

    document.getElementById(
      "newProductStock"
    ).value = "";

    loadProducts();

  } catch (err) {

    console.error(err);

    msg.innerText =
      "Server error ❌";
  }
}

/* ================= ORDERS ================= */

async function loadOrders() {

  const list =
    document.getElementById("ordersList");

  if (!list) return;

  try {

    const token =
      localStorage.getItem("token");

    const res = await fetch(
      API_BASE + "/orders",
      {
        headers: {
          Authorization:
            "Bearer " + token
        }
      }
    );

    const orders =
      await res.json();

    if (!res.ok) {

      list.innerHTML =
        "<li>Failed to load orders</li>";

      return;
    }

    list.innerHTML = "";

    let paid = 0;
    let pending = 0;

    orders.forEach(order => {

      if (order.status === "PAID") {
        paid++;
      }

      if (order.status === "UNPAID") {
        pending++;
      }

      list.innerHTML += `
        <li>
          ${order.items?.[0]?.name || "Item"}
          —
          KES ${order.total}
          —
          ${order.status}
        </li>
      `;
    });

    document.getElementById(
      "totalOrders"
    ).innerText =
      orders.length;

    document.getElementById(
      "paidOrders"
    ).innerText =
      paid;

    document.getElementById(
      "pendingOrders"
    ).innerText =
      pending;

  } catch (err) {

    console.error(err);

    list.innerHTML =
      "<li>Orders load failed</li>";
  }
}

/* ================= CASH POS ================= */

async function sellCashProduct() {

  const product =
    document
      .getElementById("cashProduct")
      .value
      .trim();

  const quantity = Number(
    document.getElementById(
      "cashQuantity"
    ).value || 1
  );

  const amount = Number(
    document.getElementById(
      "cashAmount"
    ).value
  );

  const msg =
    document.getElementById("cashMsg");

  if (
    !product ||
    !amount ||
    !quantity
  ) {

    msg.innerText =
      "Enter product, quantity and amount ⚠️";

    return;
  }

  try {

    const business =
      JSON.parse(
        localStorage.getItem("business")
      );

    if (!business) {

      msg.innerText =
        "No business session ❌";

      return;
    }

    msg.innerText =
      "Recording sale...";

    const res = await fetch(

      API_BASE +

      "/products/cash-sale",

      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          productName: product,

          quantity,

          amount,

          whatsappNumber:
            business.whatsappNumber
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {

      msg.innerText =
        data.message || "Sale failed ❌";

      return;
    }

    msg.innerText =
      `Sale recorded ✅ Remaining stock: ${data.remainingStock}`;

    document.getElementById(
      "cashProduct"
    ).value = "";

    document.getElementById(
      "cashQuantity"
    ).value = "";

    document.getElementById(
      "cashAmount"
    ).value = "";

    loadProducts();
    loadDashboard();
    loadOrders();

  } catch (err) {

    console.error(err);

    msg.innerText =
      "Cash sale failed ❌";
  }
}

/* ================= INIT ================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const token =
      localStorage.getItem("token");

    if (token) {

      document.getElementById(
        "authScreen"
      ).style.display = "none";

      document.getElementById(
        "app"
      ).style.display = "block";

      showView("dashboard");

    } else {

      document.getElementById(
        "authScreen"
      ).style.display = "flex";

      document.getElementById(
        "app"
      ).style.display = "none";
    }
  }
);
