import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCyJ7AgQ0ExSN1QqOQ0MM3IjbN1v6Cu8co",
  authDomain: "lockedin-habit-tracker.firebaseapp.com",
  projectId: "lockedin-habit-tracker",
  storageBucket: "lockedin-habit-tracker.firebasestorage.app",
  messagingSenderId: "526566101461",
  appId: "1:526566101461:web:323945bf18172351862d5c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);