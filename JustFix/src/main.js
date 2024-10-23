import { createApp } from 'vue';
import router from './router';
import './styles.scss';
import App from './App.vue';
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'; // No need to import 'bootstrap' if you're only using CSS

// Firebase imports
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

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
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();
const db = getFirestore(firebaseApp);

// Create and mount the Vue app
const app = createApp(App);

// Use Vue Router
app.use(router);

// Export Firebase services
export { auth, provider, db, signInWithPopup };

// Mount the Vue app
app.mount('#app');
