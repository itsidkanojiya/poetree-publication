import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Lock, User } from "lucide-react";
import MinNavbar from "../../components/MinNavbar";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(
    localStorage.getItem("rememberedUsername") || ""
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem("rememberMe") === "true"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

 const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const res = await login(username, password);
    const user = res.user;

    if (rememberMe) {
      localStorage.setItem("rememberedUsername", username);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("rememberedUsername");
      localStorage.removeItem("rememberMe");
    }

    // Token and user are already stored by AuthContext.login()
    // No need to store again

    if (user.is_number_verified === 1) {
      navigate("/dashboard");
    } else {
      navigate("/auth/verify-otp", { state: {  userId: user.id,
      email: user.email} });
    }
  } catch (err) {
    setError(err.message || "Invalid username or password");
  } finally {
    setLoading(false);
  }
};



  return (
    <>
      <MinNavbar />
      <div className="relative flex items-center justify-center min-h-screen bg-[#4DBEFF50] p-4">
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-50 bg-fixed bg-repeat"></div>
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 absolute z-100">
          <h2 className="text-2xl font-bold text-center text-black mb-6">
            Welcome Back
          </h2>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 pl-10 border rounded-lg focus:ring-[#5D87FF] focus:border-[#5D87FF] transition-all"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pl-10 border rounded-lg focus:ring-[#5D87FF] focus:border-[#5D87FF] transition-all"
                required
              />
            </div>

            {/* Remember Me & Login Button */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="rounded text-[#5D87FF] focus:ring-[#5D87FF]"
                />
                <span>Remember Me</span>
              </label>
              <button
                type="submit"
                className="bg-[#5D87FF] text-white px-5 py-2 rounded-lg shadow-md hover:bg-[#4DBEFF] transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
          <div className="text-center text-sm text-gray-500 mt-6">
            <span className="mr-2">New to</span>
            <span className="font-bold text-[#378F7E]">POETREE?</span>
            <a
              href="/auth/register"
              className="ml-2 text-[#378F7E] font-semibold hover:underline transition-all duration-300"
            >
              Register Yourself
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
