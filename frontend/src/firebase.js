import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC4h42NYJHBghS8nQN16rdhvAjhkLHNLXA",
  authDomain: "ridabest786.firebaseapp.com",
  databaseURL: "https://ridabest786-default-rtdb.firebaseio.com",
  projectId: "ridabest786",
  storageBucket: "ridabest786.firebasestorage.app",
  messagingSenderId: "805181900398",
  appId: "1:805181900398:web:522aea42a56407a1ce087f",
  measurementId: "G-N9JB780920"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth & DB export karo
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
