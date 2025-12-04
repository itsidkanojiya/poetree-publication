import React, {useState} from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="w-full px-6 py-1 md:px-14 flex items-center justify-between">
      {/* Logo Section */}
      <div className="flex items-center">
        <img className="h-10 md:h-20" src="/poetree.png" alt="Poetree Logo" />
        <h1 className="font-bold text-2xl md:text-3xl text-primary uppercase ml-2">
          Poetree
        </h1>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex h-full w-1/3 items-center justify-evenly text-black font-semibold text-md uppercase">
        <a className="hover:text-secondary" href="/auth/login">
          Login
        </a>
        <a className="hover:text-secondary" href="/auth/register">
          Register
        </a>
        <a className="hover:text-secondary" href="/dashboard">
          Dashboard
        </a>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-black hover:text-secondary focus:outline-none"
        >
          {isMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-accent shadow-lg text-black font-semibold text-md uppercase flex flex-col items-center space-y-4 py-4 z-50 md:hidden">
        <a className="hover:text-secondary" href="/auth/login">
          Login
        </a>
        <a className="hover:text-secondary" href="/auth/register">
          Register
        </a>
        <a className="hover:text-secondary" href="/dashboard">
          Dashboard
        </a>
        </div>
      )}
    </div>
  );
};

