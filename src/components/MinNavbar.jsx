import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";
const MinNavbar = () => {
  const [greeting, setGreeting] = useState("");

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
  return (
    <header className="bg-white shadow-md py-3 px-6 md:px-10 flex justify-between items-center relative z-20">
      <div className="flex items-center gap-4 md:gap-16">
        <div className="hidden md:flex items-center">
          <img width={70} src="/poetree.png" alt="logo" />
          <h1 className="text-lg font-bold">POETREE</h1>
        </div>

        <h1 className="text-[10px] leading-[8px] md:text-xs/3 text-gray-500 font-semibold md:border-l pl-3 md:pl-5 md:border-l-slate-400">
          {greeting}, <br />
          <span className="text-lg md:text-xl text-black">Teacher!</span>
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Link to="/" className="text-gray-600 hover:text-black">
          <Home size={20} md:size={24} />
        </Link>
      </div>
    </header>
  );
};

export default MinNavbar;
