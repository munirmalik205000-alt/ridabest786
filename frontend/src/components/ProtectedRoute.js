import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  // ❌ अगर user नहीं → login भेजो
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ अगर user है → page दिखाओ
  return children;
};

export default ProtectedRoute;
