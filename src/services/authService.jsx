import apiClient from "./apiClient";

// Login Function
export const loginUser = async (username, password) => {
  try {
    const response = await apiClient.post("/auth/login", { username, password });
    console.log("Login API response:", response.data);
    return response.data; // Assuming { token, user }
  } catch (error) {
    console.error("Login API error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Login failed");
  }
};


// Register Function
export const registerUser = async (userData) => {
  try {
    console.log("Registering user:", userData);
    const response = await apiClient.post("/auth/signup", userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Registration failed" };
  }
};


// Logout Function (Clears Token)
export const logoutUser = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
};

// Check Authenticated User
export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  if (!user) {
    console.log("No user found in localStorage.");
    return null;
  }
  return JSON.parse(user);
};
