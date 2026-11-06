// Firebase client configuration for Ronyal Developers.
// This file contains public web-app configuration, not a service-account key.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhI-vikmUNPIBuXgDT1rQNM1uHfY2E9Q",
  authDomain: "ronyal-developers.firebaseapp.com",
  projectId: "ronyal-developers",
  storageBucket: "ronyal-developers.firebasestorage.app",
  messagingSenderId: "208159321652",
  appId: "1:208159321652:web:2f1e9145bb5bb6a18d2461",
  measurementId: "G-86LLYY1BBS"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { firebaseConfig };
