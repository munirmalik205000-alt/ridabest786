// Import Firebase core
import { initializeApp } from "firebase/app";

// Services
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyC4h42NYJHBghS8nQN16rdhvAjhkLHNLXA",
  authDomain: "ridabest786.firebaseapp.com",
  projectId: "ridabest786",
  storageBucket: "ridabest786.firebasestorage.app",
  messagingSenderId: "805181900398",
  appId: "1:805181900398:web:522aea42a56407a1ce087f",
  measurementId: "G-N9JB780920"
};

// Initialize
const app = initializeApp(firebaseConfig);

// Services init
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional
const analytics = getAnalytics(app);

export default app;
