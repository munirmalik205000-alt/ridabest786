import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  // ❌ Not logged in → login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Logged in → allow
  return children;
};

export default ProtectedRoute;
