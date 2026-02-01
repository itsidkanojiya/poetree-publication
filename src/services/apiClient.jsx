import axios from "axios";
import { isTokenExpired } from "../utils/tokenUtils";
import { API_BASE_URL } from "../config/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization Token Automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  // Check if token is expired before making the request
  if (token && isTokenExpired(token)) {
    // Clear expired token
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("rememberedUsername");
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("rememberedAdminUsername");
    localStorage.removeItem("rememberAdminMe");

    // Redirect to appropriate login page based on current path
    const isAdminRoute = window.location.pathname.startsWith("/admin");
    window.location.href = isAdminRoute ? "/admin/login" : "/auth/login";
    return Promise.reject(new Error("Token expired"));
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized responses (expired/invalid token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on 401
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("rememberedUsername");
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("rememberedAdminUsername");
      localStorage.removeItem("rememberAdminMe");

      // Redirect to appropriate login page based on current path
      const isAdminRoute = window.location.pathname.startsWith("/admin");
      window.location.href = isAdminRoute ? "/admin/login" : "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
