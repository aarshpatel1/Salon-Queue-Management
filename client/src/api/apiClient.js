const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiRequest(endpoint, options = {}) {
  const token = sessionStorage.getItem('staff_jwt');
  const pin = sessionStorage.getItem('staff_pin');

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

  const response = await fetch(`${API_BASE}${endpoint}`, {
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
