import axios from "axios";

/*
  Smart Biz API Client
  Phone-safe configuration
*/

// 🔥 USE YOUR ACTUAL IP (NOT localhost)
const API = axios.create({
  baseURL: "http://10.236.136.110:5001/api",
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000
});

// 🔐 Attach JWT automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("smartbiz_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
