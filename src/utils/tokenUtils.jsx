/**
 * Utility function to check if a JWT token is expired
 * @param {string} token - The JWT token to check
 * @returns {boolean} - Returns true if token is expired or invalid, false otherwise
 */
export const isTokenExpired = (token) => {
  if (!token) {
    return true; // No token means expired/invalid
  }

  try {
    // JWT tokens have three parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Invalid token format
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Base64 decode (handle URL-safe base64)
    const decodedPayload = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    );

    // Check if token has expiration claim
    if (!decodedPayload.exp) {
      return false; // No expiration claim, assume valid
    }

    // Get current time in seconds (JWT exp is in seconds)
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if token is expired
    return decodedPayload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If we can't decode, assume expired
  }
};

