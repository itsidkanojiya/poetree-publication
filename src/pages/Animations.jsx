import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Zap, Palette, Film, ArrowLeft } from "lucide-react";

const Animations = () => {
  const navigate = useNavigate();
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    // Trigger animation on mount
    setAnimationClass("animate-in");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group"
        >
          <ArrowLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Animated Icons */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="animate-bounce" style={{ animationDelay: "0s" }}>
            <div className="p-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full shadow-lg">
              <Sparkles size={40} className="text-white" />
            </div>
          </div>
          <div className="animate-bounce" style={{ animationDelay: "0.2s" }}>
            <div className="p-4 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full shadow-lg">
              <Zap size={40} className="text-white" />
            </div>
          </div>
          <div className="animate-bounce" style={{ animationDelay: "0.4s" }}>
            <div className="p-4 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full shadow-lg">
              <Palette size={40} className="text-white" />
            </div>
          </div>
          <div className="animate-bounce" style={{ animationDelay: "0.6s" }}>
            <div className="p-4 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full shadow-lg">
              <Film size={40} className="text-white" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-12 border-2 border-purple-200">
          <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-6 animate-pulse">
            Coming Soon!
          </h1>
          
          <p className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            Stay Tuned
          </p>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            We're working on something amazing! The Animations page is under
            development and will be available soon.
          </p>

          {/* Animated Progress Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full animate-pulse"
                style={{ width: "75%" }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Development in progress...</p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 transform hover:scale-105 transition-transform">
              <Sparkles size={32} className="text-purple-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-2">Interactive</h3>
              <p className="text-sm text-gray-600">
                Engaging animations and transitions
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 transform hover:scale-105 transition-transform">
              <Zap size={32} className="text-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-2">Dynamic</h3>
              <p className="text-sm text-gray-600">
                Real-time animated content
              </p>
            </div>
            <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border-2 border-pink-200 transform hover:scale-105 transition-transform">
              <Palette size={32} className="text-pink-600 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-2">Beautiful</h3>
              <p className="text-sm text-gray-600">
                Stunning visual effects
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Animations;

