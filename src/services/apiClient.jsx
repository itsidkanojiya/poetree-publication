import axios from "axios";
import { isTokenExpired } from "../utils/tokenUtils";

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "https://poetreebackend.netlify.app/api",
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

    // Redirect to login
    window.location.href = "/auth/login";
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

      // Redirect to login page
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
