import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/auth';
import { saveSession, getCurrentUser } from '../../store/userstore';
import '../../stylesheets/components.css';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      // Show more detailed error in console for debugging
      console.log('Attempting login with:', { email });
      
      // Check if the backend server is reachable first
      try {
        await fetch('http://localhost:8000/api/', { mode: 'no-cors' });
      } catch (networkErr) {
        console.error('Backend server unreachable:', networkErr);
        throw new Error('Cannot connect to the server. Please check if the backend is running.');
      }
      
      console.log('Backend server reachable, attempting login...');
      const data = await loginUser({ email, password });
      console.log('Login response:', data);
      
      if (data && data.error) {
        // Backend returned an error message
        throw new Error(data.error);
      }
      
      if (!data || (!data.access && !data.token)) {
        throw new Error('Invalid response from server');
      }
      
      // Save tokens and extract user info
      saveSession(data);
      
      // Get user from saved session
      const currentUser = getCurrentUser();
      console.log('Extracted user data:', currentUser);
      
      if (!currentUser) {
        // If user couldn't be extracted from token, show error
        throw new Error('Could not retrieve user information from token');
      }
      
      // Default to customer role if missing
      const role = currentUser?.role || 'customer';
      console.log('User role:', role);
      
      // Navigate based on role
      if (role === 'admin') {
        navigate('/admin');
      } else {
        // Try /dashboard first, fall back to /slots if needed
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Show more specific error if available
      setError(err.message || 'Network Error. Please ensure the backend server is running.');
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h2 id="signin-heading">Welcome back</h2>
      <form onSubmit={onSubmit} id="signin-form" name="signin-form" aria-labelledby="signin-heading" autoComplete="on">
        <label htmlFor="email">Email
          <input 
            id="email" 
            name="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            type="email" 
            required 
            autoComplete="email" 
            aria-required="true" 
            placeholder="your@email.com"
          />
        </label>
        <label htmlFor="password">Password
          <input 
            id="password" 
            name="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            type="password" 
            required 
            autoComplete="current-password" 
            aria-required="true"
          />
        </label>
        {error && <div className="error" role="alert">{error}</div>}
        <button type="submit" id="signin-button" name="signin-button" className="btn-primary small">Sign In</button>
      </form>
    </div>
  );
}


