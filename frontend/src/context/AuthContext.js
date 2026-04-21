import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ LOGIN (Firebase)
  const login = async (mobile, password) => {
    try {
      const q = query(
        collection(db, "users"),
        where("mobile", "==", mobile.toString().trim())
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: "User not found" };
      }

      let userData = null;
      snapshot.forEach((doc) => {
        userData = doc.data();
      });

      if (userData.password === password.toString().trim()) {
        setUser(userData);
        return { success: true };
      } else {
        return { success: false, error: "Wrong password" };
      }

  } catch (error) {
  console.error(error);
  return { success: false, error: "Login failed" };
};
}; // ✅ YE ADD KARNA HAI (line ~41)
  // ✅ REGISTER (Firebase)
  const register = async (name, mobile, password, referral_code) => {
    try {
      await addDoc(collection(db, "users"), {
        name,
        mobile: mobile.toString().trim(),
        password: password.toString().trim(),
        referral_code: referral_code || "",
      });

      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error: "Register failed" };
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ✅ HOOK
export const useAuth = () => {
  return useContext(AuthContext);
};
