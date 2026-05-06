const API_BASE = "https://navu-smart-biz-sbdh.onrender.com/api";

/* ================= UTIL ================= */

function logout() {
  localStorage.removeItem("token");
  location.reload();
}

/* ================= APP ================= */

function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));

  const el = document.getElementById(id);

  if (el) {
    el.classList.remove("hidden");
  }

  if (id === "products") {
    loadProducts();
  }
}

/* ================= LOGIN ================= */

async function login() {

  const whatsappEl = document.getElementById("whatsapp");
  const businessEl = document.getElementById("businessName");

  if (!whatsappEl || !businessEl) {
    alert("Login inputs missing ❌");
    return;
  }

  const whatsapp = whatsappEl.value.trim();
  const businessName = businessEl.value.trim();

  if (!whatsapp || !businessName) {
    alert("Enter WhatsApp and Business Name ⚠️");
    return;
  }

  /* SIMPLE DIRECT LOGIN */
  localStorage.setItem("token", "smartbiz-user");

  document.getElementById("authScreen").style.display = "none";
  document.getElementById("app").style.display = "block";

  showView("dashboard");
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

      list.innerHTML += `
        <li>${p.name} – KES ${p.price}</li>
      `;
    });

  } catch (err) {

    console.log(err);

    list.innerHTML = "<li>Failed to load products</li>";
  }
}

/* ================= ADD PRODUCT ================= */

async function addProduct() {

  const msg = document.getElementById("productMsg");

  const name = document.getElementById("newProductName").value;

  const price = Number(
    document.getElementById("newProductPrice").value
  );

  if (!name || !price) {

    msg.innerText = "Enter name and price ⚠️";

    return;
  }

  msg.innerText = "Adding...";

  try {

    const res = await fetch(
      API_BASE + "/products/public/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          price
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {

      msg.innerText = data.message || "Failed ❌";

      return;
    }

    msg.innerText = "Product added ✅";

    document.getElementById("newProductName").value = "";

    document.getElementById("newProductPrice").value = "";

    loadProducts();

  } catch (err) {

    console.error(err);

    msg.innerText = "Server error ❌";
  }
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {

  const token = localStorage.getItem("token");

  if (token) {

    document.getElementById("authScreen").style.display = "none";

    document.getElementById("app").style.display = "block";

    showView("dashboard");

  } else {

    document.getElementById("authScreen").style.display = "flex";

    document.getElementById("app").style.display = "none";
  }
});
