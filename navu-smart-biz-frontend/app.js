const API_BASE = "http://localhost:5001/api";

/* ================= UTIL ================= */

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("business");
  location.reload();
}

/* ================= ORDER STATUS ================= */

async function updateOrderStatus(
  orderId,
  status
) {

  try {

    const res = await fetch(

      API_BASE +

      "/orders/" +

      orderId +

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
        "Update failed ❌"
      );

      return;
    }

    alert(
      `Order updated to ${status} ✅`
    );

    loadOrders();

  } catch (err) {

    console.error(err);

    alert(
      "Status update failed ❌"
    );
  }
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

  if (id === "profile") {
    loadBusinessProfile();
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

    if (!business) {
      return;
    }

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
        localStorage.getItem(
          "business"
        )
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

    const res =
      await fetch(
        API_BASE +
        "/business/me"
      );

    const data =
      await res.json();

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
    document.getElementById(
      "whatsapp"
    );

  const businessEl =
    document.getElementById(
      "businessName"
    );

  if (
    !whatsappEl ||
    !businessEl
  ) {

    alert(
      "Login inputs missing ❌"
    );

    return;
  }

  const whatsapp =
    whatsappEl.value.trim();

  const businessName =
    businessEl.value.trim();

  if (
    !whatsapp ||
    !businessName
  ) {

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
