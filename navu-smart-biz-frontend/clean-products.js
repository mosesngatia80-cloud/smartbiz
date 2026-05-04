
/* ================= PRODUCTS CLEAN ================= */

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

