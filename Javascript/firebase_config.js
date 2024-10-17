// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAgJzW4fLSxwRetmc6wrOMOfARqwskwAto",
  authDomain: "easdb-7b6e4.firebaseapp.com",
  projectId: "easdb-7b6e4",
  storageBucket: "easdb-7b6e4.appspot.com",
  messagingSenderId: "621986702779",
  appId: "1:621986702779:web:7926ff43e862bc69b5909e",
  measurementId: "G-F8GD1MC73Y"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
