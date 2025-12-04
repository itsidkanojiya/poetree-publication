import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient"; // your axios instance
import MinNavbar from "../../components/MinNavbar";
import Toast from "../../components/Common/Toast";
import { Mail, Shield, ArrowLeft, RefreshCw } from "lucide-react";

const VerifyOtp = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const maskEmail = (email) => {
    const [name, domain] = email.split("@");
    const maskedName = name.slice(0, 3) + "*".repeat(name.length - 3);
    return `${maskedName}@${domain}`;
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 4) {
      setToast({
        show: true,
        message: "Please enter a valid OTP.",
        type: "warning",
      });
      return;
    }

    if (!state?.email) {
      setToast({
        show: true,
        message: "Email not found. Please register again.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post(
        "/auth/verify-otp",
        {
          otp,
          email: state.email,
        },
        {
          timeout: 10000, // 10 second timeout
        }
      );

      // Check for successful response
      if (res.status === 200 || res.status === 201) {
        setToast({
          show: true,
          message: "Email verified successfully! Redirecting to dashboard...",
          type: "success",
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setToast({
          show: true,
          message: res.data?.message || "Invalid OTP. Please try again.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Verification error:", err);

      let errorMessage = "Verification failed. Please try again.";

      if (err.response?.status === 400 || err.response?.status === 401) {
        errorMessage =
          err.response?.data?.message ||
          "Invalid OTP. Please check and try again.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (
        err.code === "ECONNABORTED" ||
        err.message?.includes("timeout")
      ) {
        errorMessage =
          "Request timed out. Please check your connection and try again.";
      }

      setToast({
        show: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      // Always reset loading state
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiClient.post("/auth/resend-email-otp", {
        userId: state?.userId,
      });
      setToast({
        show: true,
        message: "OTP has been resent to your email. Please check your inbox.",
        type: "success",
      });
      setResendTimer(60);
    } catch (err) {
      setToast({
        show: true,
        message: "Failed to resend OTP. Please try again later.",
        type: "error",
      });
    }
  };

  return (
    <>
      <MinNavbar />
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-30 bg-fixed bg-repeat"></div>

        {/* Main Card */}
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10 z-10 border border-gray-100">
          {/* Back Button */}
          <button
            onClick={() => navigate("/auth/register")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6 group"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="text-sm font-medium">Back to Registration</span>
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
              <Shield size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              Verify Your Email
            </h2>
            <p className="text-gray-600 text-sm">
              We've sent a verification code to
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Mail size={16} className="text-blue-600" />
              <p className="text-gray-800 font-semibold">
                {state?.email ? maskEmail(state.email) : "your email"}
              </p>
            </div>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter OTP Code
            </label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
              }}
              maxLength={6}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-center text-2xl font-bold tracking-widest bg-gray-50"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={loading || !otp || otp.length < 4}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95 mb-6"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw size={20} className="animate-spin" />
                Verifying...
              </span>
            ) : (
              "Verify Email"
            )}
          </button>

          {/* Resend Section */}
          <div className="text-center pt-6 border-t border-gray-200">
            {resendTimer > 0 ? (
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-gray-600">
                  Didn't receive the code? Resend in
                </p>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  {resendTimer}s
                </span>
              </div>
            ) : (
              <button
                onClick={handleResend}
                className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline transition-colors mx-auto"
              >
                <RefreshCw size={16} />
                Resend OTP
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-800 text-center">
              <strong>Tip:</strong> Check your spam folder if you don't see the
              email. The code expires in 10 minutes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyOtp;
