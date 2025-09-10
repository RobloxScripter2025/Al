const loginForm = document.getElementById("login-form");
const loginContainer = document.getElementById("login-container");
const dashboardContainer = document.getElementById("dashboard-container");
const loginError = document.getElementById("login-error");
const aiToggle = document.getElementById("ai-toggle");
const aiStatus = document.getElementById("ai-status");
const logoutBtn = document.getElementById("logout-btn");

// Admin credentials
const ADMIN_USER = "Braxton";
const ADMIN_PASS = "OGMSAdmin";

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    loginContainer.classList.add("hidden");
    dashboardContainer.classList.remove("hidden");
  } else {
    loginError.textContent = "Invalid username or password.";
  }
});

aiToggle.addEventListener("change", () => {
  const enabled = aiToggle.checked;
  aiStatus.textContent = enabled ? "AI Enabled" : "AI Disabled";

  fetch("/api/admin/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
});

logoutBtn.addEventListener("click", () => {
  dashboardContainer.classList.add("hidden");
  loginContainer.classList.remove("hidden");
  loginForm.reset();
  loginError.textContent = "";
});
