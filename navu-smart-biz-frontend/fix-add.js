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

    console.log("STATUS:", res.status);

    const data = await res.json();
    console.log("RESPONSE:", data);

    if (!res.ok) {
      msg.innerText = data.message || "Error ❌";
      return;
    }

    msg.innerText = "Product added ✅";

    // clear fields
    document.getElementById("newProductName").value = "";
    document.getElementById("newProductPrice").value = "";

    // reload list
    if (typeof loadProducts === "function") {
      loadProducts();
    }

  } catch (err) {
    console.error("ERROR:", err);
    msg.innerText = "Failed ❌";
  }
}
