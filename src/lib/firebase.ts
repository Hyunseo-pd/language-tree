import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7OcYt_5L4UxpLc5WZIIz-P6EtT1DaeQ4",
  authDomain: "wordnote-65a0d.firebaseapp.com",
  projectId: "wordnote-65a0d",
  storageBucket: "wordnote-65a0d.firebasestorage.app",
  messagingSenderId: "999206543266",
  appId: "1:999206543266:web:1bf1d94e045c926e389cfb",
  measurementId: "G-WYWG84G7EW",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
