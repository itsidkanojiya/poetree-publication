import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Outlet, useNavigate } from "react-router-dom";
import { isTokenExpired } from "../../utils/tokenUtils";
import AdminSidebar from "../../components/Admin/AdminSidebar";

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    // Check if token is expired
    if (isTokenExpired(token)) {
      // Clear all auth-related data
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("rememberedAdminUsername");
      localStorage.removeItem("rememberAdminMe");

      // Logout from context
      if (logout) {
        logout();
      }

      // Redirect to admin login page
      navigate("/admin/login", { replace: true });
    }
  }, [navigate, logout]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 lg:ml-72 p-8">
        <div className="relative">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;

