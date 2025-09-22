export function getAccessToken() {
  return localStorage.getItem('accessToken');
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  } catch (_) {
    return null;
  }
}

export function extractUserFromAccessToken(accessToken) {
  if (!accessToken) return null;
  
  try {
    const claims = parseJwt(accessToken);
    if (!claims) return null;
    
    console.log('JWT token claims:', claims); // Debug: log the token claims
    
    // Extract user data from JWT claims, with multiple possible field names
    const user = {
      id: claims.user_id ?? claims.sub ?? claims.id ?? null,
      email: claims.email ?? null,
      username: claims.username ?? claims.name ?? null,
      role: claims.role ?? claims.groups?.[0] ?? 'customer', // Default to customer if role is missing
    };
    
    // Require at least an ID or email
    if (!user.id && !user.email) return null;
    
    console.log('Extracted user:', user); // Debug: log the extracted user
    return user;
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
}


