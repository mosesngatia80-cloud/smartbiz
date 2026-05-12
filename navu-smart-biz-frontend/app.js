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

  if (id === "orders") {
    loadOrders();
  }

  /* ✅ LOAD EXPENSES */

  if (id === "expenses") {
    loadExpenses();
  }

  /* ✅ LOAD DEBTS */

  if (id === "debts") {
    loadDebts();
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

/* ================= EXPENSES ================= */

async function loadExpenses() {

  const list =
    document.getElementById("expensesList");

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

      "/expense?whatsappNumber=" +

      encodeURIComponent(
        business.whatsappNumber
      )
    );

    const data =
      await res.json();

    if (!res.ok) {

      list.innerHTML =
        "<li>Failed to load expenses</li>";

      return;
    }

    document.getElementById(
      "totalExpenses"
    ).innerText =
      `KES ${data.totalExpenses}`;

    list.innerHTML = "";

    data.expenses.forEach(exp => {

      const time =
        new Date(exp.createdAt)
          .toLocaleString();

      list.innerHTML += `
        <li class="order-card">

          <div>
            <strong>Title:</strong>
            ${exp.title}
          </div>

          <div>
            <strong>Amount:</strong>
            KES ${exp.amount}
          </div>

          <div>
            <strong>Category:</strong>
            ${exp.category}
          </div>

          <div>
            <strong>Note:</strong>
            ${exp.note}
          </div>

          <div>
            <strong>Time:</strong>
            ${time}
          </div>

        </li>
      `;
    });

  } catch (err) {

    console.error(err);

    list.innerHTML =
      "<li>Failed to load expenses</li>";
  }
}

async function addExpense() {

  const title =
    document.getElementById(
      "expenseTitle"
    ).value;

  const amount =
    Number(
      document.getElementById(
        "expenseAmount"
      ).value
    );

  const category =
    document.getElementById(
      "expenseCategory"
    ).value;

  const note =
    document.getElementById(
      "expenseNote"
    ).value;

  const msg =
    document.getElementById(
      "expenseMsg"
    );

  const business =
    JSON.parse(
      localStorage.getItem("business")
    );

  if (
    !business ||
    !title ||
    !amount
  ) {

    msg.innerText =
      "Enter title and amount ⚠️";

    return;
  }

  try {

    msg.innerText =
      "Saving expense...";

    const res = await fetch(

      API_BASE +
      "/expense/create",

      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({

          whatsappNumber:
            business.whatsappNumber,

          title,
          amount,
          category,
          note
        })
      }
    );

    const data =
      await res.json();

    if (!res.ok) {

      msg.innerText =
        data.message ||
        "Failed ❌";

      return;
    }

    msg.innerText =
      "Expense added ✅";

    document.getElementById(
      "expenseTitle"
    ).value = "";

    document.getElementById(
      "expenseAmount"
    ).value = "";

    document.getElementById(
      "expenseCategory"
    ).value = "";

    document.getElementById(
      "expenseNote"
    ).value = "";

    loadExpenses();

  } catch (err) {

    console.error(err);

    msg.innerText =
      "Expense failed ❌";
  }
}

/* ================= DEBTS ================= */

async function addDebt() {

  const customerName =
    document.getElementById(
      "debtCustomerName"
    ).value;

  const customerPhone =
    document.getElementById(
      "debtCustomerPhone"
    ).value;

  const totalAmount =
    document.getElementById(
      "debtTotalAmount"
    ).value;

  const amountPaid =
    document.getElementById(
      "debtAmountPaid"
    ).value || 0;

  const note =
    document.getElementById(
      "debtNote"
    ).value;

  const msg =
    document.getElementById(
      "debtMsg"
    );

  try {

    const business =
      JSON.parse(
        localStorage.getItem(
          "business"
        )
      );

    const res = await fetch(

      API_BASE + "/debt/create",

      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          phone:
            business.phone ||

            business.whatsappNumber,

          customerName,
          customerPhone,
          totalAmount,
          amountPaid,
          note
        })
      }
    );

    const data =
      await res.json();

    if (!res.ok) {

      msg.innerText =
        data.message ||
        "Failed ❌";

      return;
    }

    msg.innerText =
      "Debt added ✅";

    loadDebts();

  } catch (err) {

    console.error(err);

    msg.innerText =
      "Server error ❌";
  }
}

async function loadDebts() {

  const list =
    document.getElementById(
      "debtsList"
    );

  if (!list) return;

  try {

    const business =
      JSON.parse(
        localStorage.getItem(
          "business"
        )
      );

    const res = await fetch(

      API_BASE +

      "/debt?phone=" +

      encodeURIComponent(

        business.phone ||

        business.whatsappNumber
      )
    );

    const data =
      await res.json();

    list.innerHTML = "";

    document.getElementById(
      "totalDebt"
    ).innerText =
      `KES ${data.totalDebt}`;

    data.debts.forEach(d => {

      list.innerHTML += `
        <li class="order-card">

          <div>
            <strong>Customer:</strong>
            ${d.customerName}
          </div>

          <div>
            <strong>Phone:</strong>
            ${d.customerPhone}
          </div>

          <div>
            <strong>Total:</strong>
            KES ${d.totalAmount}
          </div>

          <div>
            <strong>Paid:</strong>
            KES ${d.amountPaid}
          </div>

          <div>
            <strong>Balance:</strong>
            KES ${d.balance}
          </div>

          <div>
            <strong>Status:</strong>
            ${d.status}
          </div>

        </li>
      `;
    });

  } catch (err) {

    console.error(err);
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

      const itemNames =
        order.items
          ?.map(i =>
            `${i.name} x${i.qty}`
          )
          .join(", ");

      const customer =
        order.customerPhone ||
        "Walk-in Customer";

      const payment =
        order.paymentMethod ||
        "UNKNOWN";

      const source =
        order.source ||
        "UNKNOWN";

      const time =
        new Date(order.createdAt)
          .toLocaleString();

      list.innerHTML += `
        <li class="order-card">

          <div>
            <strong>Customer:</strong>
            ${customer}
          </div>

          <div>
            <strong>Items:</strong>
            ${itemNames}
          </div>

          <div>
            <strong>Total:</strong>
            KES ${order.total}
          </div>

          <div>
            <strong>Payment:</strong>
            ${payment}
          </div>

          <div>
            <strong>Source:</strong>
            ${source}
          </div>

          <div>
            <strong>Status:</strong>
            ${order.status}
          </div>

          <div>
            <strong>Time:</strong>
            ${time}
          </div>

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

/* ================= PAY DEBT ================= */

async function payDebt(debtId) {

  const amount =
    prompt(
      "Enter payment amount"
    );

  if (!amount) {
    return;
  }

  try {

    const res = await fetch(

      API_BASE +

      "/debt/pay/" +

      debtId,

      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify({
            amount
          })
      }
    );

    const data =
      await res.json();

    if (!res.ok) {

      alert(
        data.message ||
        "Payment failed ❌"
      );

      return;
    }

    alert(
      "Debt payment recorded ✅"
    );

    loadDebts();

  } catch (err) {

    console.error(err);

    alert(
      "Server error ❌"
    );
  }
}

/* ================= UPDATED DEBTS UI ================= */

async function loadDebts() {

  const list =
    document.getElementById(
      "debtsList"
    );

  if (!list) return;

  try {

    const business =
      JSON.parse(
        localStorage.getItem(
          "business"
        )
      );

    const res = await fetch(

      API_BASE +

      "/debt?phone=" +

      encodeURIComponent(

        business.phone ||

        business.whatsappNumber
      )
    );

    const data =
      await res.json();

    list.innerHTML = "";

    document.getElementById(
      "totalDebt"
    ).innerText =
      `KES ${data.totalDebt}`;

    data.debts.forEach(d => {

      list.innerHTML += `
        <li class="order-card">

          <div>
            <strong>Customer:</strong>
            ${d.customerName}
          </div>

          <div>
            <strong>Phone:</strong>
            ${d.customerPhone}
          </div>

          <div>
            <strong>Total:</strong>
            KES ${d.totalAmount}
          </div>

          <div>
            <strong>Paid:</strong>
            KES ${d.amountPaid}
          </div>

          <div>
            <strong>Balance:</strong>
            KES ${d.balance}
          </div>

          <div>
            <strong>Status:</strong>
            ${d.status}
          </div>

          <button
            onclick="payDebt('${d._id}')"
          >
            Record Payment
          </button>

        </li>
      `;
    });

  } catch (err) {

    console.error(err);
  }
}
