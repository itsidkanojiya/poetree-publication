import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, Mail, Shield, CheckCircle, LogOut, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const VerificationPending = ({ onClose, showCloseButton = false }) => {
  const [dots, setDots] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setShowLogoutModal(false);
    if (onClose) {
      onClose();
    } else {
      navigate("/auth/login");
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-2xl w-full relative z-10">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Close Button (if showCloseButton is true) */}
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
          )}

          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-8 text-center relative">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 shadow-lg">
                <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                Verification Pending
              </h1>
              <p className="text-amber-50 text-lg">
                Your account is under review{dots}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Info Alert */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-amber-900 mb-2">
                    Account Verification in Progress
                  </h3>
                  <p className="text-amber-800 leading-relaxed">
                    Our backend team will get back to you once your account is verified. 
                    This process typically takes 24-48 hours. You'll be able to access the dashboard after verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">What happens next?</h3>
              
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Step 1: Submission Complete</h4>
                  <p className="text-sm text-gray-600">Your registration details have been successfully submitted.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-amber-600 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Step 2: Verification in Progress</h4>
                  <p className="text-sm text-gray-600">Our team is verifying your school and account information.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl opacity-60">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-gray-500" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Step 3: Email Notification</h4>
                  <p className="text-sm text-gray-600">You'll receive an email once your account is verified.</p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Need Help?</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    If you have any questions or your verification is taking longer than expected, please contact our support team.
                  </p>
                  <a 
                    href="mailto:support@poetree.com" 
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                  >
                    <Mail className="w-4 h-4" />
                    support@poetree.com
                  </a>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRefresh}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-5 h-5" />
                Check Status
              </button>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-gray-600">
          <p className="text-sm">
            Thank you for your patience! We'll notify you as soon as your account is ready.
          </p>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Logout Confirmation</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to logout? You'll need to log back in to check your verification status.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for blob animation */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default VerificationPending;

