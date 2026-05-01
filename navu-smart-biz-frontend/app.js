const API_BASE = "https://navu-smart-biz-sbdh.onrender.com/api";

/* UTIL */
function togglePassword() {
  password.type = password.type === "password" ? "text" : "password";
}
function forgotPassword() {
  alert("Contact support: navusystems@gmail.com");
}
function logout() {
  localStorage.removeItem("token");
  location.reload();
}
function authHeader() {
  return { Authorization: "Bearer " + localStorage.getItem("token") };
}

/* AUTH */
async function login() {
  const res = await fetch(API_BASE + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.value, password: password.value })
  });
  const data = await res.json();
  if (!res.ok) return authMsg.innerText = data.message;
  localStorage.setItem("token", data.token);
  ensureBusiness();
}

/* REGISTER */
async function register() {
  const res = await fetch(API_BASE + "/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  });
  const data = await res.json();
  if (!res.ok) return authMsg.innerText = data.message;
  localStorage.setItem("token", data.token);
  ensureBusiness();
}

/* BUSINESS FLOW */
async function ensureBusiness() {
  const res = await fetch(API_BASE + "/business/me", { headers: authHeader() });
  if (res.ok) return showApp();
  authScreen.style.display = "none";
  businessSetup.style.display = "flex";
}

async function createBusiness() {
  await fetch(API_BASE + "/business", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({
      name: bizName.value,
      category: bizCategory.value,
      phone: bizPhone.value,
      whatsappNumber: bizWhatsapp.value
    })
  });
  showApp();
}

/* APP */
async function showApp() {
  authScreen.style.display = "none";
  businessSetup.style.display = "none";
  app.style.display = "block";
  loadDashboard();
  loadCustomers();
  loadProfile();
}

function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* DASHBOARD */
async function loadDashboard() {
  const orders = await fetch(API_BASE + "/orders", {
    headers: authHeader()
  }).then(r => r.json());

  totalSales.innerText = orders.reduce((s, o) => s + (o.total || 0), 0);
  orderCount.innerText = orders.length;

  const wallet = await fetch(API_BASE + "/wallet/balance", {
    headers: authHeader()
  }).then(r => r.json());

  walletBalance.innerText = wallet.balance;
}

/* CUSTOMERS */
async function loadCustomers() {
  const orders = await fetch(API_BASE + "/orders", {
    headers: authHeader()
  }).then(r => r.json());

  const map = {};
  orders.forEach(o => {
    const phone = o.customerPhone || "POS-WALKIN";
    if (!map[phone]) map[phone] = { count: 0, total: 0, last: o.createdAt };
    map[phone].count++;
    map[phone].total += o.total || 0;
    map[phone].last = o.createdAt;
  });

  customersTable.innerHTML = "";
  Object.entries(map).forEach(([p, c]) => {
    customersTable.innerHTML += `
      <tr>
        <td>${p}</td>
        <td>${c.count}</td>
        <td>KES ${c.total}</td>
        <td>${new Date(c.last).toLocaleString()}</td>
      </tr>`;
  });
}

/* PROFILE */
async function loadProfile() {
  const biz = await fetch(API_BASE + "/business/me", {
    headers: authHeader()
  }).then(r => r.json());

  editBizName.value = biz.name;
  editBizPhone.value = biz.phone;
  editBizWhatsapp.value = biz.whatsappNumber;
}

async function saveBusiness() {
  await fetch(API_BASE + "/business", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify({
      name: editBizName.value,
      phone: editBizPhone.value,
      whatsappNumber: editBizWhatsapp.value
    })
  });
  profileMsg.innerText = "Saved successfully";
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("token")) ensureBusiness();
});

/* SALES */
async function loadSales() {
  const orders = await fetch(API_BASE + "/orders", {
    headers: authHeader()
  }).then(r => r.json());

  const table = document.getElementById("salesTable");
  if (!table) return;

  table.innerHTML = "";

  orders.filter(o => o.status === "PAID").forEach(o => {
    const products = o.items.map(i => i.name || "Item").join(", ");
    const qty = o.items.reduce((s, i) => s + Number(i.quantity || i.qty || 0), 0);

    table.innerHTML += `
      <tr>
        <td>${new Date(o.createdAt).toLocaleString()}</td>
        <td>${products}</td>
        <td>${qty}</td>
        <td>KES ${o.total}</td>
      </tr>`;
  });
}

/* ================= PRODUCTS (FIXED MVP MODE) ================= */
async function loadProducts() {
  const list = document.getElementById("productsList");
  if (!list) return;

  try {
    const products = await fetch(API_BASE + "/products/public/all").then(r => r.json());

    list.innerHTML = "";
    products.forEach(p => {
      list.innerHTML += `<li>${p.name} – KES ${p.price}</li>`;
    });

  } catch {
    list.innerHTML = "<li>Failed to load products</li>";
  }
}

async function addProduct() {
  productMsg.innerText = "Adding...";

  try {
    const res = await fetch(API_BASE + "/products/public/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newProductName.value,
        price: Number(newProductPrice.value)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      productMsg.innerText = data.message || "Failed";
      return;
    }

    newProductName.value = "";
    newProductPrice.value = "";
    productMsg.innerText = "Product added";

    loadProducts();

  } catch {
    productMsg.innerText = "Error adding product";
  }
}

/* ORDERS */
async function loadOrders() {
  const table = document.getElementById("ordersTable");
  if (!table) return;

  table.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

  try {
    const orders = await fetch(API_BASE + "/orders", {
      headers: authHeader()
    }).then(r => r.json());

    table.innerHTML = "";

    if (!orders.length) {
      table.innerHTML = "<tr><td colspan='5'>No orders yet</td></tr>";
      return;
    }

    orders.forEach(o => {
      const products = o.items.map(i => i.name || "Item").join(", ");
      const qty = o.items.reduce((s, i) => s + Number(i.quantity || i.qty || 0), 0);

      table.innerHTML += `
        <tr>
          <td>${new Date(o.createdAt).toLocaleString()}</td>
          <td>${products}</td>
          <td>${qty}</td>
          <td>KES ${o.total}</td>
          <td>${o.status}</td>
        </tr>`;
    });
  } catch {
    table.innerHTML = "<tr><td colspan='5'>Failed to load orders</td></tr>";
  }
}

/* VIEW HOOK */
const __showView = showView;
showView = function (v) {
  __showView(v);
  if (v === "sales") loadSales();
  if (v === "products") loadProducts();
  if (v === "orders") loadOrders();
};

/* ================= PRODUCTS (FINAL FIX) ================= */

async function loadProducts() {
  const list = document.getElementById("productsList");
  if (!list) return;

  try {
    const products = await fetch(API_BASE + "/products/public/all")
      .then(r => r.json());

    list.innerHTML = "";

    products.forEach(p => {
      list.innerHTML += `<li>${p.name} – KES ${p.price}</li>`;
    });

  } catch (err) {
    console.log(err);
    list.innerHTML = "<li>Failed to load products</li>";
  }
}

async function addProduct() {
  productMsg.innerText = "Adding...";

  try {
    const res = await fetch(API_BASE + "/products/public/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: newProductName.value,
        price: Number(newProductPrice.value)
      })
    });

    const data = await res.json();

    if (!res.ok) {
      productMsg.innerText = data.message || "Error";
      return;
    }

    productMsg.innerText = "Product added";

    newProductName.value = "";
    newProductPrice.value = "";

    loadProducts();

  } catch (err) {
    console.log(err);
    productMsg.innerText = "Failed";
  }
}


/* ================= SAFE MVP APP LOAD ================= */
async function showApp() {
  authScreen.style.display = "none";
  businessSetup.style.display = "none";
  app.style.display = "block";

  // ❌ DISABLED (require token)
  // loadDashboard();
  // loadCustomers();
  // loadProfile();

  console.log("MVP mode: dashboard auth disabled");
}


document.addEventListener("DOMContentLoaded", () => {
  console.log("MVP mode loaded (no auth)");
});

