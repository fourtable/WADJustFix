// firebaseManager.js
// Import Firebase SDKs for app and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { firebaseConfig } from "../../config.js"

//create App
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

export { db, fbApp }; 