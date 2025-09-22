import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../../store/userstore';

export default function UserDebug() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get the current user from localStorage
    const currentUser = getCurrentUser();
    setUser(currentUser);
    console.log('Current user in localStorage:', currentUser);
  }, []);

  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>User Debug</h2>
        <div style={{ color: 'red' }}>
          <strong>No user found in localStorage.</strong> 
          <p>You need to log in first!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>User Debug Information</h2>
      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '5px',
        border: '1px solid #ddd' 
      }}>
        <h3>Current User in localStorage</h3>
        <pre style={{ overflow: 'auto' }}>{JSON.stringify(user, null, 2)}</pre>
        
        <p style={{ marginTop: '20px' }}>
          <strong>User ID:</strong> {user.id || 'Not available'}
        </p>
        <p>
          <strong>Username:</strong> {user.username || 'Not available'}
        </p>
        <p>
          <strong>Email:</strong> {user.email || 'Not available'}
        </p>
        <p>
          <strong>Role:</strong> {user.role || 'Not available'}
        </p>
      </div>
    </div>
  );
}