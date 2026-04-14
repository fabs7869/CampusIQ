import axios from 'axios';
import Cookies from 'js-cookie';

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:8000/api/v1`;
    }
  }
  return 'http://127.0.0.1:8000/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL()
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Remove any Content-Type header for FormData so the browser can set the correct multipart boundary.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized Handling (Definitive State Reset)
    if (error.response?.status === 401) {
      console.warn("--- AUTH FAILURE --- Clearing session and redirecting.");
      
      // Force cookie clearance across all paths
      Cookies.remove('token', { path: '/' });
      Cookies.remove('role', { path: '/' });
      Cookies.remove('user', { path: '/' });
      
      // Ensure we absolute-wipe all document cookies just in case
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Avoid redirect loops and toast storms: skip toast.error for 401
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.replace('/');
      }
      
      // Return a special silent rejection to prevent the component from toasting
      (error as any).silent = true;
      return Promise.reject(error);
    }
    
    // Globally flatten FastAPI 422 Validation Error arrays into strings
    if (error.response?.data?.detail && Array.isArray(error.response.data.detail)) {
       const firstError = error.response.data.detail[0];
       if (firstError?.msg) {
          error.response.data.detail = firstError.msg;
       } else {
          error.response.data.detail = JSON.stringify(error.response.data.detail);
       }
    }

    return Promise.reject(error);
  }
);

export default api;
