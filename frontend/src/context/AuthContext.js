import React, { createContext, useState, useEffect, useContext } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext(null);

// ✅ LOGIN FUNCTION (Firebase)
const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// ✅ PROVIDER
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simple init (no backend call)
    setLoading(false);
  }, []);

  // ✅ SAFE REGISTER (backend nahi hai)
  const register = async () => {
    return { success: false, error: "Backend not connected" };
  };

  // ✅ SAFE LOGOUT
  const logout = async () => {
    setUser(null);
    return true;
  };

  // ✅ SAFE REFRESH
  const refreshUser = async () => {
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ HOOK
export const useAuth = () => {
  return useContext(AuthContext);
};
