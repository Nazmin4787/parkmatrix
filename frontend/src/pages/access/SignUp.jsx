import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/auth';
import { saveSession } from '../../store/userstore';
import '../../stylesheets/components.css';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await registerUser({ username, email, password, role });
      saveSession(data);
      navigate(role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError('Registration failed');
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h2>Create your account</h2>
      <form onSubmit={onSubmit}>
        <label>Username
          <input value={username} onChange={e => setUsername(e.target.value)} required />
        </label>
        <label>Email
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        </label>
        <label>Password
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        </label>
        <label>Role
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="btn-primary small">Create Account</button>
      </form>
    </div>
  );
}


