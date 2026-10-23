/**
 * Vijayadashami Carnival — Admin Login Handler
 */

const API_BASE_URL = window.API_BASE_URL || (
  window.location.protocol === 'file:'
    ? 'http://localhost:5000'
    : (window.location.port === '5000' ? '' : 'http://localhost:5000')
);

document.addEventListener('DOMContentLoaded', () => {
  checkExistingSession();
  initLoginForm();
});

/**
 * Checks if the organizer already has an active authenticated session
 */
async function checkExistingSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/me`, {
      method: 'GET',
      credentials: 'include'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        window.location.replace('dashboard.html');
      }
    }
  } catch {
    // If offline or not authenticated, stay on login page
  }
}

/**
 * Attaches form submission handler
 */
function initLoginForm() {
  const form = document.getElementById('adminLoginForm');
  const usernameInput = document.getElementById('adminUsername');
  const passwordInput = document.getElementById('adminPassword');
  const submitBtn = document.getElementById('btnLoginSubmit');
  const btnText = document.getElementById('btnLoginText');
  const errorAlert = document.getElementById('loginErrorAlert');
  const errorMsg = document.getElementById('loginErrorMsg');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput?.value.trim();
    const password = passwordInput?.value;

    if (!username || !password) {
      showError('Please enter both username and password.');
      return;
    }

    // Set loading UI
    setLoading(true);
    hideError();

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        // Successful login: Store CSRF token in sessionStorage for quick access
        if (data.csrfToken) {
          sessionStorage.setItem('srmu_csrf_token', data.csrfToken);
        }
        if (data.admin) {
          sessionStorage.setItem('srmu_admin_user', JSON.stringify(data.admin));
        }

        // Redirect to dashboard
        window.location.replace('dashboard.html');
      } else {
        const message = data?.error || data?.message || 'Invalid username or password.';
        showError(message);
        setLoading(false);
      }
    } catch (err) {
      showError('Unable to connect to the authentication server. Please verify backend is running on port 5000.');
      setLoading(false);
    }
  });

  function setLoading(loading) {
    if (submitBtn) {
      submitBtn.disabled = loading;
    }
    if (btnText) {
      btnText.textContent = loading ? 'Authenticating...' : 'Sign In to Dashboard';
    }
  }

  function showError(msg) {
    if (errorMsg) errorMsg.textContent = msg;
    if (errorAlert) errorAlert.style.display = 'flex';
  }

  function hideError() {
    if (errorAlert) errorAlert.style.display = 'none';
  }
}
