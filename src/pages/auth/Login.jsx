import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MinNavbar from "../../components/MinNavbar";
import VerificationPending from "../../components/Common/VerificationPending";
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import Loader from "../../components/Common/loader/loader";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [credentials, setCredentials] = useState({
    username: localStorage.getItem("rememberedUsername") || "",
    password: "",
    rememberMe: localStorage.getItem("rememberMe") === "true",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerificationPending, setShowVerificationPending] = useState(false);

  // Get the message from navigation state (if redirected from protected route)
  const redirectMessage = location.state?.message;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials({
      ...credentials,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await login(credentials.username, credentials.password);
      const user = res.user;

      // Handle remember me
      if (credentials.rememberMe) {
        localStorage.setItem("rememberedUsername", credentials.username);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedUsername");
        localStorage.removeItem("rememberMe");
      }

      // Token and user are already stored by AuthContext.login()
      // No need to store again

      // Check if user is verified
      const isVerified = user.is_verified === true || user.is_verified === 1;

      if (!isVerified) {
        // Show verification pending screen
        setShowVerificationPending(true);
        setLoading(false);
        return;
      }

      // If verified, proceed with normal flow
      if (user.is_number_verified === 1) {
        navigate("/dashboard");
      } else {
        navigate("/auth/verify-otp", { 
          state: { 
            userId: user.id,
            email: user.email
          } 
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed! Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  // If verification pending, show full screen component instead of login form
  if (showVerificationPending) {
    return (
      <VerificationPending
        showCloseButton={false}
        onClose={() => {
          setShowVerificationPending(false);
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          window.location.reload();
        }}
      />
    );
  }

  return (
    <>
      <MinNavbar />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Welcome Back
            </h1>
            <p className="text-xl text-gray-600">
              Sign in to continue to Poetree
            </p>
          </div>

          {/* Redirect Message */}
          {redirectMessage && (
            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
              <p className="text-amber-800 text-sm text-center font-medium">
                {redirectMessage}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-800 text-sm text-center font-medium">
                {error}
              </p>
            </div>
          )}

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username/Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                    placeholder="Enter your username or email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={credentials.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    Remember Me
                  </span>
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader size="sm" className="inline-block text-white" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">
                  Don't have an account?
                </span>
              </div>
            </div>

            {/* Register Link */}
            <Link
              to="/auth/register"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create New Account</span>
            </Link>
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              By signing in, you agree to our{" "}
              <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-semibold">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
