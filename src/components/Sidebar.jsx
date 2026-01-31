import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  History,
  User,
  LogOut,
  Menu,
  X,
  FileText,
  FilePlus,
  ClipboardCheck,
  ChevronRight,
  BookOpen,
  Sparkles,
  LayoutTemplate,
} from "lucide-react";

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-lg font-semibold mb-4">
          Are you sure you want to log out?
        </h2>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Yes, Logout
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [greeting, setGreeting] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("rememberedUsername");
    sessionStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    sessionStorage.clear();

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", () => navigate("/"));

    console.log("You're logged out.");
    navigate("/auth/login");
  };

  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      setGreeting("Good morning");
    } else if (currentHour < 18) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "History", href: "/dashboard/history", icon: History },
    {
      name: "Question Papers",
      href: "/dashboard/generate/header",
      icon: FileText,
      state: { from: "prebuild" },
    },
    {
      name: "Prebuilt Question",
      href: "/dashboard/templates",
      icon: LayoutTemplate,
    },
    {
      name: "Worksheets",
      href: "/dashboard/generate/worksheets",
      icon: FilePlus,
    },
    {
      name: "Answer Sheets",
      href: "/dashboard/generate/answersheets",
      icon: ClipboardCheck,
    },
    {
      name: "Subject Requests",
      href: "/dashboard/subject-requests",
      icon: BookOpen,
    },
    {
      name: "Animations",
      href: "/dashboard/animations",
      icon: Sparkles,
    },
  ];

  const isActive = (path) => {
    // Special handling for Dashboard - only active on exact match
    if (path === "/dashboard") {
      return location.pathname === "/dashboard" || location.pathname === "/dashboard/";
    }
    // For templates (Prebuilt Question) route, check if pathname starts with the route path
    if (path === "/dashboard/templates") {
      return location.pathname.startsWith(path);
    }
    // For other routes, check exact match
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-2xl z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 w-72`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Greeting */}
          <div className="p-6 border-b border-gray-200">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                width={60}
                src="/poetree.png"
                alt="logo"
                className="rounded-lg"
              />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                POETREE
              </h1>
            </Link>
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <p className="text-xs text-gray-600 mb-1">{greeting},</p>
              <p className="text-lg font-bold text-gray-800 capitalize truncate">
                {user?.name || "Teacher"}!
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    state={item.state}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      active
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon
                      size={20}
                      className={
                        active
                          ? "text-white"
                          : "text-gray-500 group-hover:text-blue-600"
                      }
                    />
                    <span className="font-medium flex-1">{item.name}</span>
                    {active && <ChevronRight size={18} />}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section - Profile & Logout */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <Link
              to="/dashboard/profile"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive("/dashboard/profile")
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <User
                size={20}
                className={
                  isActive("/dashboard/profile")
                    ? "text-white"
                    : "text-gray-500 group-hover:text-blue-600"
                }
              />
              <span className="font-medium flex-1">Profile</span>
            </Link>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 group"
            >
              <LogOut
                size={20}
                className="text-red-500 group-hover:text-red-600"
              />
              <span className="font-medium flex-1 text-left">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          handleLogout();
          setIsLogoutModalOpen(false);
        }}
      />
    </>
  );
};

export default Sidebar;
