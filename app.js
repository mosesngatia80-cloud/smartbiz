const API_BASE = "https://navu-smart-biz-sbdh.onrender.com/api";

/* ================= AUTH ================= */

async function showApp() {
  document.getElementById("authScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  await ensureBusiness();
  loadDashboard();
  loadProducts();
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

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API_BASE + "/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  document.getElementById("authMsg").innerText =
    res.ok ? "Registered. Now login." : data.message;
}

/* ================= CORE ================= */

function showView(view) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(view).classList.remove("hidden");

  if (view === "products") loadProducts();
}

async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: "Bearer " + token
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");

  return data;
}

/* ================= DASHBOARD ================= */

async function loadDashboard() {
  const sales = await authFetch(API_BASE + "/sales");
  document.getElementById("totalSales").innerText =
    Array.isArray(sales)
      ? sales.reduce((s, x) => s + Number(x.amount || 0), 0)
      : 0;
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

/* ================= 🤖 AI ASSISTANT ================= */

async function sendAI() {
  const input = document.getElementById("aiInput");
  const output = document.getElementById("aiOutput");
  if (!input.value) return;

  output.textContent = "Processing...";

  try {
    const res = await authFetch(API_BASE + "/ai", {
      method: "POST",
      body: JSON.stringify({ message: input.value })
    });

    output.textContent = JSON.stringify(res, null, 2);

    input.value = "";
    loadProducts();
    loadDashboard();

  } catch (err) {
    output.textContent = err.message;
  }
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (token) await showApp();
});
