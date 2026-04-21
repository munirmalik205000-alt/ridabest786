// Import Firebase core
import { initializeApp } from "firebase/app";

// Services
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ❌ analytics hata diya (important)

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

// export
export default app;
