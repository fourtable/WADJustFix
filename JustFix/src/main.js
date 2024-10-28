import { createApp, onUnmounted, ref, computed } from 'vue';
import router from './router';
import './styles.scss';
import App from './App.vue';
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.css'; // No need to import 'bootstrap' if you're only using CSS
import store from './store/store'; // Import Vuex store


// Firebase imports
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"; // Import Firestore
import { getStorage } from 'firebase/storage';

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
const storage = getStorage(firebaseApp);
const messagesCollection = collection(db, 'messages')
const messagesQuery = query(messagesCollection, orderBy('createdAt', 'desc'), limit(100));
const store = createStore({
    modules: {
        notification: notificationStore, // Register your notification store
    },
});
// const filter = new filter();

// Function to fetch repairers from Firestore
async function fetchRepairmen() {
    const q = query(collection(db, 'users'), where('userType', '==', 'repairer'));
    const querySnapshot = await getDocs(q);
    const repairmen = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.businessLocation && data.businessLocation.lat && data.businessLocation.lng) {
            repairmen.push({
                name: data.name,
                lat: data.businessLocation.lat,
                lng: data.businessLocation.lng
            });
        }
    });
    return repairmen;
}

// Google Maps initialization function
let map;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    map = new Map(document.getElementById('map'), {
        center: { lat: 1.3521, lng: 103.8198 },
        zoom: 12,
        mapId: 'your-map-id'
    });

    // Fetch repairer locations and add markers
    const repairmen = await fetchRepairmen();
    repairmen.forEach((repairman) => {
        const customContent = document.createElement('div');
        const img = document.createElement('img');
        img.src = './images/newpin.png';
        img.style.width = '100px';
        img.style.height = '100px';
        customContent.appendChild(img);

        new AdvancedMarkerElement({
            position: { lat: repairman.lat, lng: repairman.lng },
            map: map,
            title: repairman.name,
            content: customContent
        });
    });
}

window.initMap = initMap;

(g => {
    var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window;
    b = b[c] || (b[c] = {});
    var d = b.maps || (b.maps = {}),
        r = new Set,
        e = new URLSearchParams,
        u = () => h || (h = new Promise(async(f, n) => {
            await (a = m.createElement("script"));
            e.set("libraries", [...r] + "");
            for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]);
            e.set("callback", c + ".maps." + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => h = n(Error(p + " could not load."));
            a.nonce = m.querySelector("script[nonce]")?.nonce || "";
            m.head.append(a)
        }));
    d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n))
})({
    key: "AIzaSyAe51tIu9Mpq06AxiZRLbiziX_NH2X6cLw",
    v: "weekly",
});

// Check if User has log in
export function useAuth() {
    const user = ref(null)
    const unsubscribe = auth.onAuthStateChanged(_user => (user.value = _user))
    onUnmounted(unsubscribe)
    const isLogin = computed(() => user.value !== null)
  
    const signIn = async () => {
      const googleProvider = new firebase.auth.GoogleAuthProvider()
      await auth.signInWithPopup(googleProvider)
    }
    const signOut = () => auth.signOut()
  
    return { user, isLogin, signIn, signOut }
  }

// Message Function
export function useChat() {
    const messages = ref([])
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        messages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    onUnmounted(unsubscribe)

    const { user, isLogin } = useAuth()
    const sendMessage = text => {
        if (!isLogin.value) return
        const {photoURL, uid, displayName } = user.value;
        messagesCollection.add({
            userName: displayName,
            userId: uid,
            userPhotoURL: photoURL,
            text: text,
            createdAt: firebaseApp.db.FieldValue.serverTimeStamp(),
        })
    }

    return {messages, sendMessage}

}

createApp(App).use(store).use(router).mount('#app');
// Export Firebase services
export { firebaseApp, storage, auth, provider, db, signInWithPopup };