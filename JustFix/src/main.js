import { createApp } from 'vue'
import router from './router'
import './styles.scss'
import App from './App.vue'
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'

createApp(App).use(router).mount('#app')

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js"; // Import Firestore

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDiBHdWrHj34O4hn0qP98qgThAAgDuL5JU",
    authDomain: "justfix-726f7.firebaseapp.com",
    projectId: "justfix-726f7",
    storageBucket: "justfix-726f7.appspot.com",
    messagingSenderId: "297198741199",
    appId: "1:297198741199:web:4a00011fa3067f8014b9ba",
    measurementId: "G-YN894CVT62"
  };
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Set up Google Sign-In provider
const provider = new GoogleAuthProvider();

// Firestore instance
const db = getFirestore(app);

// Export the auth instance and app
export { auth, app, provider, db, signInWithPopup };

