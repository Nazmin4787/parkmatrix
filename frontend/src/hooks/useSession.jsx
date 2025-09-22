import { useEffect, useState } from 'react';
import { getCurrentUser } from '../store/userstore';

export default function useSession() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  return user;
}


