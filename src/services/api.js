import axios from 'axios';

const api = axios.create({
  baseURL: 'https://trackit-backend-alpha.vercel.app', 
});

api.interceptors.request.use((config) => {
  const { useAuthStore } = require('../stores/authStore');
  const token = useAuthStore.getState().token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;