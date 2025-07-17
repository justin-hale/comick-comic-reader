// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// Optional: import analytics if you want to track usage
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCli3bi9pwxwzPeQ1KTrTTFw7eAs0GBS1Q",
  authDomain: "comick-reader.firebaseapp.com",
  projectId: "comick-reader",
  storageBucket: "comick-reader.firebasestorage.app",
  messagingSenderId: "879088811255",
  appId: "1:879088811255:web:4bdbb5421794c5562267f2",
  measurementId: "G-VK37FZE3EX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services we need for the comic reader
export const db = getFirestore(app);
export const auth = getAuth(app);

// Optional: Initialize Analytics if you want usage tracking
// export const analytics = getAnalytics(app);