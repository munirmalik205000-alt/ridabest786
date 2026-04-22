import React, { createContext, useState, useEffect, useContext } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

// ✅ LOGIN FUNCTION
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
    setLoading(false);
  }, []);

  const handleLogin = async (email, password) => {
    const res = await login(email, password);
    if (res.success) setUser(res.user);
    return res;
  };

  const logout = async () => {
    setUser(null);
  };

  const register = async () => {
    return { success: false, error: "Backend not connected" };
  };

  const refreshUser = async () => {
    return true;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login: handleLogin, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ HOOK
export const useAuth = () => {
  return useContext(AuthContext);
};
