import axios from "axios";

// All requests go to /api on the same site:
//  - development: Vite proxies /api to Express on :5000
//  - production:  vercel.json rewrites /api/* to the Render API
// The JWT lives in an httpOnly cookie, so JavaScript never touches it.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 60000, // the free Render instance can take ~50 s to wake up
});

// Turns an axios error into a readable message
export function errorMessage(err) {
  if (err.code === "ECONNABORTED") return "The server is waking up — please try again in a few seconds";
  return err.response?.data?.message || err.message || "Something went wrong";
}

export default api;
