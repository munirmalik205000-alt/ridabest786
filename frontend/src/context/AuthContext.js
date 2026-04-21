import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;
const TOKEN_KEY = 'smartpay360_token';

// Axios defaults: send cookies + attach Authorization header if token stored
axios.defaults.withCredentials = true;

function setAuthHeader(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

function getStoredToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function storeToken(token) {
  try { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); } catch {}
}

// Initialize header on module load so requests fired before mount still authenticate
setAuthHeader(getStoredToken());

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/auth/me`);
      setUser(data);
    } catch (error) {
      setUser(false);
      storeToken(null);
      setAuthHeader(null);
    } finally {
      setLoading(false);
    }
  };

  import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

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
  }
};
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
