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

const WATERMARK_TYPES = ["none", "text", "image", "text_and_image"];

/**
 * Update worksheet watermark opacity (0–1). Used for personalized worksheet PDFs.
 * Sends JSON body; backend stores and uses this when generating worksheet PDFs.
 */
export const updateWorksheetWatermarkOpacity = async (value) => {
  const clamped = Math.min(1, Math.max(0, Number(value)));
  const response = await apiClient.put("/auth/profile", {
    worksheet_watermark_opacity: clamped,
  });
  return response.data;
};

/**
 * Update worksheet watermark settings: type (none | text | image | text_and_image),
 * optional custom text, and opacity (0–1). Sends JSON to PUT /auth/profile.
 */
export const updateWorksheetWatermarkSettings = async (payload) => {
  const body = {};
  if (payload.type != null) {
    const type = String(payload.type).toLowerCase();
    if (!WATERMARK_TYPES.includes(type)) {
      throw new Error(`Invalid watermark type: ${payload.type}`);
    }
    body.worksheet_watermark_type = type;
  }
  if (payload.text !== undefined) {
    body.worksheet_watermark_text =
      payload.text == null ? "" : String(payload.text).trim().slice(0, 200);
  }
  if (payload.opacity != null) {
    body.worksheet_watermark_opacity = Math.min(
      1,
      Math.max(0, Number(payload.opacity))
    );
  }
  if (payload.rotation != null) {
    const rot = Number(payload.rotation);
    body.worksheet_watermark_rotation = Math.min(180, Math.max(-180, rot));
  }
  if (payload.bend != null) {
    const bend = Number(payload.bend);
    body.worksheet_watermark_bend = Math.min(20, Math.max(-20, bend));
  }
  const response = await apiClient.put("/auth/profile", body);
  return response.data;
};
