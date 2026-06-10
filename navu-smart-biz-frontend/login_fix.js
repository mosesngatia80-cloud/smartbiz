function login() {

  const whatsappEl = document.getElementById("whatsapp");
  const businessEl = document.getElementById("businessName");

  const whatsapp = whatsappEl ? whatsappEl.value.trim() : "";
  const businessName = businessEl ? businessEl.value.trim() : "";

  console.log("LOGIN DEBUG:", { whatsapp, businessName });

  if (!whatsapp || !businessName) {
    alert("Enter WhatsApp and Business Name ⚠️");
    return;
  }

  fetch(API_BASE + "/auth/login-whatsapp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      whatsappNumber: whatsapp,
      name: businessName
    })
  })
  .then(res => res.json().then(data => ({ ok: res.ok, data })))
  .then(({ ok, data }) => {

    if (!ok) {
      alert(data.message || "Login failed ❌");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("business", JSON.stringify(data.business));

    document.getElementById("authScreen").style.display = "none";
    document.getElementById("app").style.display = "block";

    showView("dashboard");
  })
  .catch(err => {
    console.error(err);
    alert("Server error ❌");
  });

}
