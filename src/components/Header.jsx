"use state";
import React from "react";
import { Link } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import { BiSolidPhoneCall } from "react-icons/bi";
import { LuLogIn } from "react-icons/lu";

export const Header = () => {
  return (

    <div className="hidden md:flex h-14 w-full px-5 md:px-10 bg-primary justify-between items-center">
      {/* Left Section */}
      <div id="nav-left" className="w-1/2 md:w-1/3 h-full text-neutral text-sm md:text-md font-semibold">
        <ul className="h-full flex items-center justify-evenly space-x-4 md:space-x-8">
          <li className="flex items-center">
            <FiMail className="mx-2 text-white" />
            <a href="mailto:support@poetree.com" className="hover:text-secondary">
              support@poetree.com
            </a>
          </li>
          <li className="flex items-center">
            <BiSolidPhoneCall className="mx-2 text-white" />
            <a href="tel:+910000000000" className="hover:text-secondary">
              (+91) 00000 00000
            </a>
          </li>
        </ul>
      </div>

      {/* Right Section */}
      <div id="nav-right" className="w-1/2 md:w-1/3 h-full text-neutral text-sm md:text-md font-semibold">
        <ul className="h-full flex items-center justify-evenly space-x-4 md:space-x-8">
          <li className="flex items-center">
            <LuLogIn className="mr-2 text-accent" />
            <Link className="hover:text-secondary" to="/auth/login">
              Login
            </Link>
            /
            <Link className="hover:text-secondary" to="/auth/register">
              Register
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard"
              className="h-10 px-4 md:px-5 bg-secondary text-white rounded-md flex items-center justify-center hover:bg-secondary-dark"
            >
              Dashboard
            </Link>
          </li>
        </ul>
      </div>
    </div>

  );
};
