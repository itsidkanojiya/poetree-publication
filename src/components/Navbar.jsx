import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, LayoutDashboard, User, LogOut, LogIn, UserPlus } from "lucide-react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate("/");
  };

  const desktopNav = user ? (
    <div className="hidden md:flex items-center gap-2">
      <Link
        to="/dashboard"
        onClick={() => setIsMenuOpen(false)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition"
      >
        <LayoutDashboard className="w-4 h-4" />
        Dashboard
      </Link>
      <Link
        to="/dashboard/profile"
        onClick={() => setIsMenuOpen(false)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition"
      >
        <User className="w-4 h-4" />
        Profile
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 font-medium transition border border-slate-200 hover:border-red-200"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>
    </div>
  ) : (
    <div className="hidden md:flex items-center gap-3">
      <Link
        to="/auth/login"
        onClick={() => setIsMenuOpen(false)}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition"
      >
        <LogIn className="w-4 h-4" />
        Login
      </Link>
      <Link
        to="/auth/register"
        onClick={() => setIsMenuOpen(false)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm hover:shadow transition"
      >
        <UserPlus className="w-4 h-4" />
        Get Started
      </Link>
    </div>
  );

  const mobileNav = user ? (
    <div className="flex flex-col gap-1 py-2">
      <Link
        to="/dashboard"
        onClick={() => setIsMenuOpen(false)}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
      >
        <LayoutDashboard className="w-5 h-5" />
        Dashboard
      </Link>
      <Link
        to="/dashboard/profile"
        onClick={() => setIsMenuOpen(false)}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
      >
        <User className="w-5 h-5" />
        Profile
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600 font-medium w-full text-left"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  ) : (
    <div className="flex flex-col gap-1 py-2">
      <Link
        to="/auth/login"
        onClick={() => setIsMenuOpen(false)}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
      >
        <LogIn className="w-5 h-5" />
        Login
      </Link>
      <Link
        to="/auth/register"
        onClick={() => setIsMenuOpen(false)}
        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold mx-2 mt-2 text-center justify-center"
      >
        <UserPlus className="w-5 h-5" />
        Get Started
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200/80 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0"
            onClick={() => setIsMenuOpen(false)}
          >
            <img
              className="h-9 md:h-10 w-auto"
              src="/poetree.png"
              alt="Poetree"
            />
            <span className="font-bold text-xl md:text-2xl text-slate-800 tracking-tight">
              Poetree
            </span>
          </Link>

          {/* Desktop nav */}
          {desktopNav}

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 bg-white rounded-b-xl shadow-lg -mx-4 px-4 mt-0">
            {mobileNav}
          </div>
        )}
      </nav>
    </header>
  );
};
