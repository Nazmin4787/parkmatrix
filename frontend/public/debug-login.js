// Login shortcut for testing
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.createElement('div');
  loginForm.className = 'login-debug-form';
  loginForm.style.position = 'fixed';
  loginForm.style.bottom = '10px';
  loginForm.style.right = '10px';
  loginForm.style.background = '#f0f0f0';
  loginForm.style.padding = '10px';
  loginForm.style.border = '1px solid #ccc';
  loginForm.style.zIndex = '1000';

  loginForm.innerHTML = `
    <h3>Debug Login</h3>
    <input id="debug-email" type="text" placeholder="Email" value="testuser@example.com" />
    <input id="debug-password" type="password" placeholder="Password" value="password123" />
    <button id="debug-login">Login</button>
  `;

  document.body.appendChild(loginForm);

  document.getElementById('debug-login').addEventListener('click', function() {
    const email = document.getElementById('debug-email').value;
    const password = document.getElementById('debug-password').value;
    
    // Make login request
    fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Login response:', data);
      if (data.access) {
        // Save tokens and user data
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('refreshToken', data.refresh);
        
        // Parse the JWT to get user info
        const payload = JSON.parse(atob(data.access.split('.')[1]));
        localStorage.setItem('user', JSON.stringify({
          id: payload.user_id,
          email: payload.email,
          username: payload.username,
          role: payload.role || 'customer'
        }));
        
        alert('Login successful!');
        location.reload();
      } else {
        alert('Login failed: ' + (data.detail || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Login error:', error);
      alert('Login error: ' + error.message);
    });
  });
});