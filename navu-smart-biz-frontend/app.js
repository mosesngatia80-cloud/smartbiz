const API_BASE = "https://navu-smart-biz-sbdh.onrender.com/api";

/* ================= AUTH ================= */

async function showApp() {
  document.getElementById("authScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  await ensureBusiness();
  loadDashboard();
  loadProducts();
  loadWalletBalance();
}

async function ensureBusiness() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await fetch(API_BASE + "/business/me", {
    headers: { Authorization: "Bearer " + token }
  });

  if (res.ok) return;

  await fetch(API_BASE + "/business", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      name: "My SmartBiz Business",
      category: "Retail",
      phone: "0700000000"
    })
  });
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API_BASE + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) {
    document.getElementById("authMsg").innerText = data.message || "Login failed";
    return;
  }

  localStorage.setItem("token", data.token);
  await showApp();
}

/* ================= CORE ================= */

function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(view).classList.remove("hidden");

  if (view === "products") loadProducts();
  if (view === "orders") loadOrders();
  if (view === "sales") loadSales();
  if (view === "customers") loadCustomers();
}

async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
}

/* ================= DASHBOARD ================= */

async function loadDashboard() {
  const orders = await authFetch(API_BASE + "/orders");

  document.getElementById("totalSales").innerText =
    orders.reduce((s, o) => s + Number(o.total || 0), 0);

  document.getElementById("orderCount").innerText = orders.length;
}

/* ================= WALLET ================= */

async function loadWalletBalance() {
  try {
    const wallet = await authFetch(API_BASE + "/wallet/balance");
    document.getElementById("walletBalance").innerText = wallet.balance;
  } catch (err) {
    console.error("Wallet error:", err.message);
  }
}

/* ================= PRODUCTS ================= */

async function loadProducts() {
  const products = await authFetch(API_BASE + "/products");
  const list = document.getElementById("productsList");
  list.innerHTML = "";

  products.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.name} – KES ${p.price}`;
    list.appendChild(li);
  });
}

/* ================= ORDERS (WITH PRODUCTS + QTY) ================= */

async function loadOrders() {
  const orders = await authFetch(API_BASE + "/orders");
  const table = document.getElementById("ordersTable");
  table.innerHTML = "";

  orders.forEach(o => {
    const products = o.items.map(i => i.name).join(", ");
    const qty = o.items.reduce((s, i) => s + Number(i.qty || 0), 0);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(o.createdAt).toLocaleString()}</td>
      <td>${products}</td>
      <td>${qty}</td>
      <td>KES ${o.total}</td>
      <td>${o.status}</td>
    `;
    table.appendChild(tr);
  });
}

/* ================= SALES (WITH PRODUCTS + QTY) ================= */

async function loadSales() {
  const orders = await authFetch(API_BASE + "/orders");
  const table = document.getElementById("salesTable");
  table.innerHTML = "";

  orders
    .filter(o => o.status === "PAID")
    .forEach(o => {
      const products = o.items.map(i => i.name).join(", ");
      const qty = o.items.reduce((s, i) => s + Number(i.qty || 0), 0);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(o.createdAt).toLocaleString()}</td>
        <td>${products}</td>
        <td>${qty}</td>
        <td>KES ${o.total}</td>
      `;
      table.appendChild(tr);
    });
}

/* ================= CUSTOMERS ================= */

async function loadCustomers() {
  const customers = await authFetch(API_BASE + "/customers");
  const list = document.getElementById("customersList");
  list.innerHTML = "";

  customers.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.name} (${c.phone})`;
    list.appendChild(li);
  });
}

/* ================= AI ================= */

async function sendAI() {
  const input = document.getElementById("aiInput");
  const output = document.getElementById("aiOutput");

  output.textContent = "Processing...";

  const res = await authFetch(API_BASE + "/ai", {
    method: "POST",
    body: JSON.stringify({ message: input.value })
  });

  output.textContent = JSON.stringify(res, null, 2);
  input.value = "";

  loadOrders();
  loadSales();
  loadDashboard();
  loadWalletBalance();
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  if (localStorage.getItem("token")) await showApp();
});
