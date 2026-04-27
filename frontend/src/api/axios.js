import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const instance = axios.create({
  baseURL: API_BASE_URL,
});

export const getDownloadUrl = (path) => {
  // If the path already starts with http, return it
  if (path.startsWith('http')) return path;
  
  // Strip leading slash if present in path and trailing slash in base
  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${cleanBase}/${cleanPath}`;
};

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
