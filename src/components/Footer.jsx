import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Heart } from "lucide-react";

const MAP_LINK = "https://share.google/UfclpKq95ufmR9Q1S";
const ADDRESS = "Shed-4, Vande Mataram-3 estate, Kathwada-Singarva Rd, opp. VR estate, Kathwada, Ahmedabad, Gujarat 382430";
const PHONE = "096013 08871";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div className="mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-4">POETREE</h2>
            <p className="text-slate-400 text-sm">
              Question papers, worksheets & answer sheets for teachers and students.
            </p>
            <p className="mt-4 text-slate-500 text-sm">© {new Date().getFullYear()} Poetree Publication. All rights reserved.</p>
          </div>

          <div className="mb-6 md:mb-0">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide text-slate-300">Get started</h3>
            <ul className="list-none">
              <li className="mb-2 text-sm">
                <Link to="/auth/login" className="text-slate-400 hover:text-white transition">
                  Login
                </Link>
              </li>
              <li className="mb-2 text-sm">
                <Link to="/auth/register" className="text-slate-400 hover:text-white transition">
                  Register
                </Link>
              </li>
              <li className="mb-2 text-sm">
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-6 md:mb-0">
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide text-slate-300">Product</h3>
            <ul className="list-none">
              <li className="mb-2 text-sm text-slate-400">Question Papers</li>
              <li className="mb-2 text-sm text-slate-400">Prebuilt Questions</li>
              <li className="mb-2 text-sm text-slate-400">Worksheets</li>
              <li className="mb-2 text-sm text-slate-400">Answer Sheets</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wide text-slate-300">Contact</h3>
            <div className="space-y-3 text-slate-400 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{ADDRESS}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="hover:text-white transition">
                  {PHONE}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map section */}
      <div className="border-t border-slate-700/50">
        <a
          href={MAP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-4 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white transition"
        >
          <MapPin className="w-5 h-5" />
          <span className="font-medium">View on Google Maps</span>
        </a>
      </div>

      {/* Made with love */}
      <div className="border-t border-slate-700/50 py-4 px-4 text-center">
        <p className="text-slate-500 text-sm flex items-center justify-center gap-1.5 flex-wrap">
          Made with
          <Heart className="w-4 h-4 text-red-500 fill-red-500 inline-block" />
          by
          <span className="text-slate-400 font-medium">Siddharth Kanojiya</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
