export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://taxmeld-backend.onrender.com/api';

export const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, '');