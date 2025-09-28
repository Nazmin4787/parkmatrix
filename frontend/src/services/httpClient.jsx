import axios from 'axios';

// When using Vite's proxy, the base URL should be relative.
// The proxy will catch the /api requests and forward them.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/plain, */*'
  }
});

// Convert any Date objects to ISO strings before sending to the API
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Handle date serialization for request data
  if (config.data) {
    config.data = JSON.parse(
      JSON.stringify(config.data, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      })
    );
  }
  
  return config;
});

// Auto-refresh access token on 401 using stored refresh token
let isRefreshing = false;
let pendingRequests = [];

function onRefreshed(newAccess) {
  pendingRequests.forEach(cb => cb(newAccess));
  pendingRequests = [];
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response && error.response.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        // No refresh token; force signout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        // Redirect to login page if not already there
        if (window.location.pathname !== '/signin') {
          window.location.href = '/signin';
        }
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((newAccess) => {
            original.headers.Authorization = `Bearer ${newAccess}`;
            resolve(http(original));
          });
        });
      }
      isRefreshing = true;
      try {
        // Use a new axios instance for the refresh request to avoid interceptor loops
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh/`, { refresh: refresh });
        const newAccess = data.access;
        if (newAccess) {
          localStorage.setItem('accessToken', newAccess);
          onRefreshed(newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return http(original);
        }
      } catch (e) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default http;


