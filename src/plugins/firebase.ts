import { initializeApp } from "firebase/app";
import { browserSessionPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

// 🔹 Replace with your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCC3nMaHPTc0yGAV39UnPDHLaA0EyciyDQ",
    authDomain: "tu-diploma.firebaseapp.com",
    projectId: "tu-diploma",
    storageBucket: "tu-diploma.firebasestorage.app",
    messagingSenderId: "881405661200",
    appId: "1:881405661200:web:54016e3fbac2d34ce47a95",
    measurementId: "G-4VZ48K7YVZ"
  };
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const functions = getFunctions(app);
  setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("✅ Firebase Auth Session Persistence Set to SESSION");
  })
  .catch((error) => {
    console.error("❌ Error setting session persistence:", error);
  });
  export { app, auth, db, storage, functions };
