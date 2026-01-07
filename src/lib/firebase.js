import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxetO7Pu-G82wsGzhBGsbMW5aTSLEp9U4",
  authDomain: "ssems-85bb7.firebaseapp.com",
  projectId: "ssems-85bb7",
  storageBucket: "ssems-85bb7.firebasestorage.app",
  messagingSenderId: "826299357472",
  appId: "1:826299357472:web:8a2f7af500eb7edb945f45",
  measurementId: "G-6P53Z64PD0"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
