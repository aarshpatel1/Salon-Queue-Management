// Automatically resolves backend URL:
// 1. Explicit VITE_API_URL if configured
// 2. Dynamic host IP (e.g. http://10.118.118.17:5000 or http://192.168.x.x:5000) when accessed from mobile devices on local network
// 3. Fallback to localhost:5000
export const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

export async function apiRequest(endpoint, options = {}) {
  const token = sessionStorage.getItem('staff_jwt');
  const pin = sessionStorage.getItem('staff_pin');
  const apiBase = getApiBase();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(pin ? { 'x-staff-pin': pin } : {}),
    ...(options.headers || {})
  };

  // If body is FormData, delete Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${apiBase}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export default apiRequest;
