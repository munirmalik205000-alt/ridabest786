import React, { createContext, useState, useContext } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔐 LOGIN
  const login = async (mobile, password) => {
    try {
      const q = query(
        collection(db, "users"),
        where("mobile", "==", mobile)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: "User not found" };
      }

      let userData = null;

      snapshot.forEach((doc) => {
        userData = doc.data();
      });

      if (userData.password === password) {
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: "Wrong password" };
      }

    } catch (error) {
      console.error(error);
      return { success: false, error: "Login failed" };
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔓 USE AUTH
export const useAuth = () => {
  return useContext(AuthContext);
};
