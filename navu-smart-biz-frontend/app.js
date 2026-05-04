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
  console.log("MVP mode running");
}

function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  if (id === "products") loadProducts();
}

/* ================= PRODUCTS ================= */

async function loadProducts() {
  const list = document.getElementById("productsList");
  if (!list) return;

  try {
    const res = await fetch(API_BASE + "/products/public/all");
    const products = await res.json();

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
  const msg = document.getElementById("productMsg");
  msg.innerText = "Adding...";

  try {
    const res = await fetch(API_BASE + "/products/public/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: document.getElementById("newProductName").value,
        price: Number(document.getElementById("newProductPrice").value)
      })
    });

    const data = await res.json();
    console.log("ADD RESPONSE:", data);

    if (!res.ok) {
      msg.innerText = data.message || "Error ❌";
      return;
    }

    msg.innerText = "Product added ✅";

    document.getElementById("newProductName").value = "";
    document.getElementById("newProductPrice").value = "";

    await loadProducts();

  } catch (err) {
    console.log(err);
    msg.innerText = "Failed ❌";
  }
}

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  console.log("App loaded");
});

async function addProduct() {
  alert("CLICK WORKING");   // 👈 MUST SHOW

  const msg = document.getElementById("productMsg");
  msg.innerText = "Adding...";

  try {
    const res = await fetch(API_BASE + "/products/public/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.getElementById("newProductName").value,
        price: Number(document.getElementById("newProductPrice").value)
      })
    });

    alert("REQUEST SENT");   // 👈 MUST SHOW

    const data = await res.json();
    alert("RESPONSE RECEIVED"); // 👈 MUST SHOW

    msg.innerText = "DONE ✅";

  } catch (err) {
    alert("ERROR");
    console.log(err);
    msg.innerText = "FAILED ❌";
  }
}


async function addProduct() {
  const msg = document.getElementById("productMsg");

  if (!msg) {
    alert("productMsg element missing ❌");
    return;
  }

  msg.innerText = "Adding...";

  try {
    const res = await fetch(API_BASE + "/products/public/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: document.getElementById("newProductName").value,
        price: Number(document.getElementById("newProductPrice").value)
      })
    });

    const data = await res.json();

    msg.innerText = "Product added ✅";

    await loadProducts();

  } catch (err) {
    console.log(err);
    msg.innerText = "Failed ❌";
  }
}

