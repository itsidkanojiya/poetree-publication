import { Navigate, useLocation } from "react-router-dom";
import { isTokenExpired } from "../utils/tokenUtils";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("authToken");
  const user = localStorage.getItem("user");
  
  // Check if user is authenticated (has valid token and user data)
  const isAuthenticated = token && user && !isTokenExpired(token);

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/auth/login" state={{ from: location }} replace />
  );
};

export default ProtectedRoute;
