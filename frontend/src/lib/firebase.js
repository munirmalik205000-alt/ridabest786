// Firebase Web SDK initialization for Rida App
// Project: rida786 (Firebase Console: https://console.firebase.google.com/project/rida786)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAY1pH3_AsxohECX98prGeu3Vmdkjyq8G0",
  authDomain: "rida786.firebaseapp.com",
  projectId: "rida786",
  storageBucket: "rida786.firebasestorage.app",
  messagingSenderId: "277888202885",
  appId: "1:277888202885:web:96ec0e789403ff3799d1ec",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export default firebaseApp;
