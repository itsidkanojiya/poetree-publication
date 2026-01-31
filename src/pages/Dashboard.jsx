import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { isTokenExpired } from "../utils/tokenUtils";
import { UserTeachingProvider, useUserTeaching } from "../context/UserTeachingContext";
import ChooseContext from "../components/Dashboard/ChooseContext";
import ContextBar from "../components/Dashboard/ContextBar";
import Loader from "../components/Common/loader/loader";

const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { loading, needsContextChoice } = useUserTeaching();
  const isCustomPaperPage = location.pathname.includes("/custompaper");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="mx-auto mb-4" />
          <p className="text-gray-600">Loading your context...</p>
        </div>
      </div>
    );
  }

  if (needsContextChoice) {
    return <ChooseContext />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!isCustomPaperPage && <Sidebar />}
      <main
        className={`flex-1 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${
          !isCustomPaperPage ? "lg:ml-72 p-8" : "p-0"
        }`}
      >
        {!isCustomPaperPage && <ContextBar />}
        <div className="relative">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (isTokenExpired(token)) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("rememberedUsername");
      localStorage.removeItem("rememberMe");
      if (logout) logout();
      navigate("/auth/login", { replace: true });
    }
  }, [navigate, logout]);

  return (
    <UserTeachingProvider>
      <DashboardLayout />
    </UserTeachingProvider>
  );
};

export default Dashboard;
