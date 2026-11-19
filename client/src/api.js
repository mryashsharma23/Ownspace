import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const u = JSON.parse(localStorage.getItem("ownspace_user") || "null");
  if (u?.token) config.headers.Authorization = `Bearer ${u.token}`;
  return config;
});

export const errMsg = (e) => e.response?.data?.message || e.message;
export default api;