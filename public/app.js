document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (res.ok) {
    sessionStorage.setItem("username", username); // Merkt sich den Namen
    window.location.href = "/dashboard.html";
  } else {
    document.getElementById("error").classList.remove("hidden");
  }
});
