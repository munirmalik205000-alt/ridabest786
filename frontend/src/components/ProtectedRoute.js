import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // ✅ loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // ❌ agar user nahi hai → login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ user hai → allow
  return children;
};

export default ProtectedRoute;
