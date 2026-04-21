import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔐 LOGIN FUNCTION (FIREBASE)
  const login = async (mobile, password) => {
    try {
      const q = query(
        collection(db, "users"),
        where("mobile", "==", mobile)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, error: "User not found" };
      }

      let userData = null;

      querySnapshot.forEach((doc) => {
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
      return { success: false, error: "Login error" };
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🧠 USE AUTH
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
    }

    let userData = null;

    querySnapshot.forEach((doc) => {
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
    return { success: false, error: "Login error" };
  }
};

  const register = async (name, mobile, password, referral_code) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/auth/register`,
        { name, mobile, password, referral_code }
      );
      if (data.access_token) {
        storeToken(data.access_token);
        setAuthHeader(data.access_token);
      }
      setUser(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: formatApiErrorDetail(error.response?.data?.detail) || error.message };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {});
    } catch (error) {
      // ignore
    }
    storeToken(null);
    setAuthHeader(null);
    setUser(false);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
