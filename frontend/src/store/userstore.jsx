import { extractUserFromAccessToken } from '../stylesheets/helpers/tokenUtils';

export function saveSession({ access, refresh, user }) {
  if (access) localStorage.setItem('accessToken', access);
  if (refresh) localStorage.setItem('refreshToken', refresh);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else if (access) {
    const derived = extractUserFromAccessToken(access);
    if (derived) localStorage.setItem('user', JSON.stringify(derived));
  }
}

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}


