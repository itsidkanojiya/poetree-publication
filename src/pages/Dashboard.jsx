import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { isTokenExpired } from "../utils/tokenUtils";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if current route is CustomPaper page
  const isCustomPaperPage = location.pathname.includes("/custompaper");

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    // Check if token is expired
    if (isTokenExpired(token)) {
      // Clear all auth-related data
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("rememberedUsername");
      localStorage.removeItem("rememberMe");

      // Logout from context
      if (logout) {
        logout();
      }

      // Redirect to login page
      navigate("/auth/login", { replace: true });
    }
  }, [navigate, logout]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Hidden on CustomPaper page */}
      {!isCustomPaperPage && <Sidebar />}

      {/* Main Content Area - Full Screen */}
      <main
        className={`flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${
          !isCustomPaperPage ? "lg:ml-72 p-8" : "p-0"
        }`}
      >
        {/* Content */}
        <div className="relative">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
