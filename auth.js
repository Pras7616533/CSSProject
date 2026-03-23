(() => {
  const AUTH_KEY = "cssproject_auth";
  const REDIRECT_KEY = "cssproject_redirect";
  const scriptEl = document.currentScript;
  const loginPath = (scriptEl && scriptEl.dataset.loginPath) || "auth.html";
  const isLoginPage = document.body && document.body.dataset.authPage === "login";
  const isAuthed = localStorage.getItem(AUTH_KEY) === "true";

  if (!isLoginPage && !isAuthed) {
    sessionStorage.setItem(REDIRECT_KEY, window.location.href);
    window.location.href = loginPath;
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(AUTH_KEY);
      window.location.href = loginPath;
    });
  }

  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("loginName");
      const password = document.getElementById("loginPassword");
      const error = document.getElementById("loginError");

      if (!name || !password) {
        return;
      }

      const nameVal = name.value.trim();
      const passVal = password.value.trim();

      if (!nameVal || !passVal) {
        if (error) {
          error.textContent = "Please enter both a name and password.";
        }
        return;
      }

      localStorage.setItem(AUTH_KEY, "true");
      if (error) {
        error.textContent = "";
      }

      const storedRedirect = sessionStorage.getItem(REDIRECT_KEY);
      sessionStorage.removeItem(REDIRECT_KEY);
      const fallback = form.dataset.redirect || "index.html";
      window.location.href = storedRedirect || fallback;
    });
  }
})();
