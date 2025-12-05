import { Navigate, useLocation } from "react-router-dom";
import { isTokenExpired } from "../utils/tokenUtils";
import { useAuth } from "../context/AuthContext";
import VerificationPending from "../components/Common/VerificationPending";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const token = localStorage.getItem("authToken");
  const storedUser = localStorage.getItem("user");

  // Parse stored user if available
  let parsedUser = null;
  try {
    parsedUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
  }

  // Use user from context if available, otherwise use parsed user from localStorage
  const currentUser = user || parsedUser;

  // Check if user is authenticated (has valid token and user data)
  const isAuthenticated = token && currentUser && !isTokenExpired(token);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth/login"
        state={{
          from: location,
          message: "Please sign up or login first to access the dashboard.",
        }}
        replace
      />
    );
  }

  // Check if user is verified
  const isVerified =
    currentUser?.is_verified === true || currentUser?.is_verified === 1;

  // If authenticated but not verified, show verification pending message
  if (!isVerified) {
    return <VerificationPending showCloseButton={false} />;
  }

  // User is authenticated and verified, allow access
  return children;
};

export default ProtectedRoute;
