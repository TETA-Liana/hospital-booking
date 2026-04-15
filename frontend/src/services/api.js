import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try a single silent refresh using the stored refresh token; if that
// fails, clear session so the app redirects to /login.
let refreshPromise = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && localStorage.getItem('refreshToken')) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/auth/refresh', { refreshToken: localStorage.getItem('refreshToken') })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const { data } = await refreshPromise;
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
