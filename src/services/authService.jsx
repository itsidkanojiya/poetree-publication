import apiClient from "./apiClient";

// Login Function
export const loginUser = async (username, password) => {
  try {
    const response = await apiClient.post("/auth/login", {
      username,
      password,
    });
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

// Get User Profile
export const getProfile = async () => {
  try {
    const response = await apiClient.get("/auth/profile");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Update User Profile
export const updateProfile = async (profileData) => {
  try {
    const formData = new FormData();

    if (profileData.school_name)
      formData.append("school_name", profileData.school_name);
    if (profileData.address) formData.append("address", profileData.address);

    // Handle logo: can be a file or URL
    if (profileData.logo) {
      if (profileData.logo instanceof File) {
        formData.append("logo", profileData.logo);
      } else if (typeof profileData.logo === "string") {
        formData.append("logo_url", profileData.logo);
      }
    }

    const response = await apiClient.put("/auth/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error updating profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};
