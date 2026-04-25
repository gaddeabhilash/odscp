import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

instance.interceptors.request.use(
  (config) => {
    // Zustand persist stores data under this key
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (err) {
        console.error('Failed to parse auth token', err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
