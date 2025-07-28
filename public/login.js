// Toggle visibility of the password field
function togglePassword() {
  const pwd = document.querySelector('input[name="password"]');
  pwd.type = pwd.type === 'password' ? 'text' : 'password';
}

// Absolute login endpoint
const LOGIN_URL = 'http://localhost:3000/auth/login';

document
  .getElementById('loginForm')
  .addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = this.email.value.trim();
    const password = this.password.value;
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = ''; // Clear previous errors

    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 🔥 Required for session cookie
        body: JSON.stringify({ email, password })
      });

      // Server responded with non-OK
      if (!res.ok) {
        let errData;
        try {
          errData = await res.json();
        } catch {
          // response is not JSON
        }
        errorMsg.textContent =
          errData?.message || `Login failed with status ${res.status}`;
        return;
      }

      // Successful login
      const data = await res.json();
      if (data.success) {
        window.location.href = '/myscores.html'; // ✅ redirect after login
      } else {
        errorMsg.textContent = data.message || 'Login failed.';
      }
    } catch (err) {
      console.error('Login request failed:', err);
      errorMsg.textContent =
        'Network error: please check your connection and try again.';
    }
  });
