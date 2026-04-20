// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC4h42NYJHBghS8nQN16rdhvAjhkLHNLXA",
  authDomain: "ridabest786.firebaseapp.com",
  projectId: "ridabest786",
  storageBucket: "ridabest786.firebasestorage.app",
  messagingSenderId: "805181900398",
  appId: "1:805181900398:web:522aea42a56407a1ce087f",
  measurementId: "G-N9JB780920"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔥 IMPORTANT (login ke liye)
export const auth = getAuth(app);

export default app;
