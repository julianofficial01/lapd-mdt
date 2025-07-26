document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorElem = document.getElementById("error");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    errorElem.classList.add("hidden");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        sessionStorage.setItem("username", username);
        window.location.href = "/dashboard.html";
      } else {
        errorElem.textContent = "Login fehlgeschlagen. Falsche Zugangsdaten.";
        errorElem.classList.remove("hidden");
      }
    } catch {
      errorElem.textContent = "Serverfehler. Bitte später erneut versuchen.";
      errorElem.classList.remove("hidden");
    }
  });
});
