import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, logoutUser, getCurrentUser, registerUser } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const register = async (username, password, email) => {
    try {
      const { token, user } = await registerUser({ username, password, email });
      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
    } catch (error) {
      console.error("Registration failed", error);
      throw error;
    }
  };
  
const login = async (username, password) => {
  try {
    const response = await loginUser(username, password);

    const { token, user } = response;

    if (!token || !user) {
      throw new Error("Invalid server response");
    }

    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);

    return { token, user }; // ✅ This was missing
  } catch (error) {
    console.error("Login failed", error);
    throw new Error(error.message || "Login failed");
  }
};


  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
