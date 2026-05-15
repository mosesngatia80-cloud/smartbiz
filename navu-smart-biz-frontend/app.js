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

  if (!whatsapp || !businessName) {

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
    ).style.display =
      "none";

    document.getElementById(
      "app"
    ).style.display =
      "block";

    showView(
      "dashboard"
    );

  } catch (err) {

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

  } catch (err) {

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

      list.innerHTML += `
        <li>
          ${p.name}
          —
          KES ${p.price}
          —
          Stock: ${p.stock}
        </li>
      `;
    });

  } catch (err) {

    console.error(err);

    list.innerHTML =
      "<li>Failed to load products</li>";
  }
}

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

  try {

    const res =
      await fetch(

        API_BASE +
        "/products/create",

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              name,
              price,
              stock,

              whatsappNumber:
                business.whatsappNumber
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
      "Product added ✅";

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
    document.getElementById(
      "ordersList"
    );

  if (!list) return;

  try {

    const token =
      localStorage.getItem(
        "token"
      );

    const res =
      await fetch(

        API_BASE +
        "/orders",

        {
          headers: {
            Authorization:
              "Bearer " +
              token
          }
        }
      );

    const orders =
      await res.json();

    list.innerHTML = "";

    orders.forEach(order => {

      const items =
        order.items
          ?.map(i =>
            `${i.name} x${i.qty}`
          )
          .join(", ");

      list.innerHTML += `
        <li>
          ${items}
          —
          KES ${order.total}
          —
          ${order.status}
        </li>
      `;
    });

  } catch (err) {

    console.error(err);

    list.innerHTML =
      "<li>Orders failed</li>";
  }
}

/* ================= EXPENSES ================= */

async function loadExpenses() {
  return;
}

/* ================= DEBTS ================= */

async function loadDebts() {
  return;
}

/* ================= PROFILE ================= */

async function loadBusinessProfile() {

  const business =
    JSON.parse(
      localStorage.getItem(
        "business"
      )
    );

  if (!business) return;

  document.getElementById(
    "profileBusinessName"
  ).innerText =
    business.name || "-";

  document.getElementById(
    "profileWhatsapp"
  ).innerText =
    business.whatsappNumber || "-";
}

/* ================= INIT ================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const token =
      localStorage.getItem(
        "token"
      );

    if (token) {

      document.getElementById(
        "authScreen"
      ).style.display =
        "none";

      document.getElementById(
        "app"
      ).style.display =
        "block";

      showView(
        "dashboard"
      );

    } else {

      document.getElementById(
        "authScreen"
      ).style.display =
        "flex";

      document.getElementById(
        "app"
      ).style.display =
        "none";
    }
  }
);

/* ================= EXPENSES ================= */

async function loadExpenses() {

  const list =
    document.getElementById(
      "expensesList"
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

      list.innerHTML += `
        <li>
          ${exp.title}
          —
          KES ${exp.amount}
          —
          ${exp.category}
        </li>
      `;
    });

  } catch (err) {

    console.error(err);
  }
}

async function addExpense() {

  const business =
    JSON.parse(
      localStorage.getItem(
        "business"
      )
    );

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

  try {

    const res =
      await fetch(

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

    loadExpenses();

  } catch (err) {

    console.error(err);

    msg.innerText =
      "Server error ❌";
  }
}

/* ================= DEBTS ================= */

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

    const res =
      await fetch(

        API_BASE +

        "/debt?phone=" +

        encodeURIComponent(

          business.phone ||

          business.whatsappNumber
        )
      );

    const data =
      await res.json();

    document.getElementById(
      "totalDebt"
    ).innerText =
      `KES ${data.totalDebt}`;

    list.innerHTML = "";

    data.debts.forEach(d => {

      list.innerHTML += `
        <li>

          ${d.customerName}
          —
          KES ${d.balance}
          —
          ${d.status}

          <button
            onclick="payDebt('${d._id}')"
          >
            Pay
          </button>

        </li>
      `;
    });

  } catch (err) {

    console.error(err);
  }
}

async function addDebt() {

  const business =
    JSON.parse(
      localStorage.getItem(
        "business"
      )
    );

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

    const res =
      await fetch(

        API_BASE +
        "/debt/create",

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

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
  }
}

async function payDebt(id) {

  const amount =
    prompt(
      "Enter payment amount"
    );

  if (!amount) return;

  try {

    await fetch(

      API_BASE +
      "/debt/pay/" +
      id,

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

    loadDebts();

  } catch (err) {

    console.error(err);
  }
}

/* ================= CASH POS ================= */

async function sellCashProduct() {

  const business =
    JSON.parse(
      localStorage.getItem(
        "business"
      )
    );

  const productName =
    document.getElementById(
      "cashProduct"
    ).value;

  const quantity =
    Number(
      document.getElementById(
        "cashQuantity"
      ).value
    );

  const amount =
    Number(
      document.getElementById(
        "cashAmount"
      ).value
    );

  const msg =
    document.getElementById(
      "cashMsg"
    );

  try {

    const res =
      await fetch(

        API_BASE +
        "/products/cash-sale",

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              productName,
              quantity,
              amount,

              whatsappNumber:
                business.whatsappNumber
            })
        }
      );

    const data =
      await res.json();

    if (!res.ok) {

      msg.innerText =
        data.message ||
        "Sale failed ❌";

      return;
    }

    msg.innerText =
      "Cash sale recorded ✅";

    loadDashboard();
    loadProducts();
    loadOrders();

  } catch (err) {

    console.error(err);
  }
}


/* ================= CASH SALE ================= */

async function sellCashProduct() {

  const msg =
    document.getElementById(
      "cashMsg"
    );

  const business =
    JSON.parse(
      localStorage.getItem(
        "business"
      )
    );

  const productName =
    document.getElementById(
      "cashProduct"
    ).value;

  const quantity =
    Number(
      document.getElementById(
        "cashQuantity"
      ).value
    );

  const amount =
    Number(
      document.getElementById(
        "cashAmount"
      ).value
    );

  try {

    const res =
      await fetch(

        API_BASE +
        "/products/cash-sale",

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({

              productName,
              quantity,
              amount,

              whatsappNumber:
                business.whatsappNumber
            })
        }
      );

    const data =
      await res.json();

    if (!res.ok) {

      msg.innerText =
        data.message ||
        "Cash sale failed ❌";

      return;
    }

    msg.innerText =
      "Cash sale recorded ✅";

    loadDashboard();
    loadProducts();
    loadOrders();

  } catch (err) {

    console.error(err);

    msg.innerText =
      "Server error ❌";
  }
}


/* ================= DEBTS ================= */

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

    const res =
      await fetch(

        API_BASE +

        "/debt?phone=" +

        encodeURIComponent(
          business.whatsappNumber
        )
      );

    const data =
      await res.json();

    if (!res.ok) {

      list.innerHTML =
        "<li>Failed to load debts</li>";

      return;
    }

    document.getElementById(
      "totalDebt"
    ).innerText =
      `KES ${data.totalDebt}`;

    list.innerHTML = "";

    data.debts.forEach(debt => {

      const created =
        new Date(
          debt.createdAt
        ).toLocaleString();

      list.innerHTML += `

        <li class="order-card">

          <div>
            <strong>Customer:</strong>
            ${debt.customerName}
          </div>

          <div>
            <strong>Phone:</strong>
            ${debt.customerPhone}
          </div>

          <div>
            <strong>Total:</strong>
            KES ${debt.totalAmount}
          </div>

          <div>
            <strong>Paid:</strong>
            KES ${debt.amountPaid}
          </div>

          <div>
            <strong>Balance:</strong>
            KES ${debt.balance}
          </div>

          <div>
            <strong>Status:</strong>
            ${debt.status}
          </div>

          <div>
            <strong>Note:</strong>
            ${debt.note || "-"}
          </div>

          <div>
            <strong>Created:</strong>
            ${created}
          </div>

          <button
            onclick="payDebt('${debt._id}')"
          >
            Pay
          </button>

        </li>
      `;
    });

  } catch (err) {

    console.error(err);

    list.innerHTML =
      "<li>Failed to load debts</li>";
  }
}


/* ================= CUSTOMERS ================= */

async function loadCustomers() {

  const list =
    document.getElementById(
      "customersList"
    );

  if (!list) return;

  try {

    const token =
      localStorage.getItem(
        "token"
      );

    const res =
      await fetch(

        API_BASE +
        "/orders/customers/list",

        {
          headers: {
            Authorization:
              "Bearer " + token
          }
        }
      );

    const customers =
      await res.json();

    if (!res.ok) {

      list.innerHTML =
        "<li>Failed to load customers</li>";

      return;
    }

    list.innerHTML = "";

    document.getElementById(
      "totalCustomers"
    ).innerText =
      customers.length;

    customers.forEach(customer => {

      list.innerHTML += `

        <li class="order-card">

          <div>
            <strong>Phone:</strong>
            ${customer.phone}
          </div>

          <div>
            <strong>Total Orders:</strong>
            ${customer.totalOrders}
          </div>

          <div>
            <strong>Total Spent:</strong>
            KES ${customer.totalSpent}
          </div>

        </li>
      `;
    });

  } catch (err) {

    console.error(err);

    list.innerHTML =
      "<li>Customers load failed</li>";
  }
}


/* ================= CLEAN ORDER UI ================= */

async function loadOrders() {

  const list =
    document.getElementById(
      "ordersList"
    );

  if (!list) return;

  try {

    const token =
      localStorage.getItem(
        "token"
      );

    const res =
      await fetch(

        API_BASE +
        "/orders",

        {
          headers: {
            Authorization:
              "Bearer " +
              token
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

    orders.forEach(order => {

      const items =
        order.items
          ?.map(i =>
            `${i.name} x${i.qty}`
          )
          .join(", ");

      const created =
        new Date(
          order.createdAt
        ).toLocaleString();

      list.innerHTML += `

        <li class="order-card">

          <div>
            <strong>Customer:</strong>
            ${order.customerPhone || "-"}
          </div>

          <div>
            <strong>Items:</strong>
            ${items}
          </div>

          <div>
            <strong>Total:</strong>
            KES ${order.total}
          </div>

          <div>
            <strong>Status:</strong>
            ${order.status}
          </div>

          <div>
            <strong>Source:</strong>
            ${order.source || "-"}
          </div>

          <div>
            <strong>Date:</strong>
            ${created}
          </div>

        </li>
      `;
    });

  } catch (err) {

    console.error(err);

    list.innerHTML =
      "<li>Orders failed</li>";
  }
}


/* ================= FINAL ORDER UI ================= */

async function loadOrders() {

  const list =
    document.getElementById(
      "ordersList"
    );

  if (!list) return;

  try {

    const token =
      localStorage.getItem(
        "token"
      );

    const res =
      await fetch(

        API_BASE +
        "/orders",

        {
          headers: {
            Authorization:
              "Bearer " +
              token
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

    orders.forEach(order => {

      const items =
        order.items
          ?.map(i =>
            `${i.name} x${i.qty}`
          )
          .join(", ");

      const created =
        new Date(
          order.createdAt
        ).toLocaleString();

      list.innerHTML += `

        <li class="order-card">

          <div>
            <strong>Customer:</strong>
            ${order.customerPhone || "-"}
          </div>

          <div>
            <strong>Items:</strong>
            ${items}
          </div>

          <div>
            <strong>Total:</strong>
            KES ${order.total}
          </div>

          <div>
            <strong>Status:</strong>
            ${order.status}
          </div>

          <div>
            <strong>Source:</strong>
            ${order.source || "-"}
          </div>

          <div>
            <strong>Date:</strong>
            ${created}
          </div>

          <div style="margin-top:10px;">

            <button
              onclick="updateOrderStatus('${order._id}','ACCEPTED')"
            >
              Accept
            </button>

          </div>

        </li>
      `;
    });

  } catch (err) {

    console.error(err);

    list.innerHTML =
      "<li>Orders failed</li>";
  }
}

/* ================= UPDATE ORDER STATUS ================= */

async function updateOrderStatus(id, status) {

  try {

    const res =
      await fetch(

        API_BASE +
        "/orders/" +
        id +
        "/status",

        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              status
            })
        }
      );

    const data =
      await res.json();

    if (!res.ok) {

      alert(
        data.message ||
        "Status update failed ❌"
      );

      return;
    }

    alert(
      "Order updated ✅"
    );

    loadOrders();

  } catch (err) {

    console.error(err);

    alert(
      "Server error ❌"
    );
  }
}


/* ================= SMART ORDER UI FILTER ================= */

async function loadOrders() {

  const list =
    document.getElementById(
      "ordersList"
    );

  if (!list) return;

  try {

    const token =
      localStorage.getItem(
        "token"
      );

    const res =
      await fetch(

        API_BASE +
        "/orders",

        {
          headers: {
            Authorization:
              "Bearer " +
              token
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

    orders.forEach(order => {

      const items =
        order.items
          ?.map(i =>
            `${i.name} x${i.qty}`
          )
          .join(", ");

      const created =
        new Date(
          order.createdAt
        ).toLocaleString();

      const showAcceptButton =

        order.source === "STORE_FRONT" &&

        order.status === "PENDING";

      list.innerHTML += `

        <li class="order-card">

          <div>
            <strong>Customer:</strong>
            ${order.customerPhone || "-"}
          </div>

          <div>
            <strong>Items:</strong>
            ${items}
          </div>

          <div>
            <strong>Total:</strong>
            KES ${order.total}
          </div>

          <div>
            <strong>Status:</strong>
            ${order.status}
          </div>

          <div>
            <strong>Source:</strong>
            ${order.source || "-"}
          </div>

          <div>
            <strong>Date:</strong>
            ${created}
          </div>

          ${
            showAcceptButton
            ? `
              <div style="margin-top:10px;">

                <button
                  onclick="updateOrderStatus('${order._id}','ACCEPTED')"
                >
                  Accept
                </button>

              </div>
            `
            : ""
          }

        </li>
      `;
    });

  } catch (err) {

    console.error(err);

    list.innerHTML =
      "<li>Orders failed</li>";
  }
}

