import React, { createContext, useState, useEffect, useContext } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
});

// ================= PROVIDER =================
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Auto check login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ================= LOGIN =================
  const login = async (email, password) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);

      return {
        success: true,
        user: res.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // ================= REGISTER =================
  const register = async (email, password) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      return {
        success: true,
        user: res.user,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error(error);
    }
  };

  // ================= REFRESH =================
  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ================= HOOK =================
export const useAuth = () => {
  return useContext(AuthContext);
};
