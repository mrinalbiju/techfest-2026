import axios from "axios";

// All requests go to /api (proxied to Express in development)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach the JWT saved at login to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turns an axios error into a readable message
export function errorMessage(err) {
  return err.response?.data?.message || err.message || "Something went wrong";
}

export default api;
