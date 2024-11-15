import { createApp, onUnmounted, ref, computed } from 'vue';
import router from './router';
import './styles.scss';
import App from './App.vue';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';

// Firebase imports
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, getDocs, where, FieldValue } from "firebase/firestore";
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import store from './store/store';

// Firebase configuration

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE,
    projectId: import.meta.env.VITE_FIREBASE_PROJECTID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDERID,
    appId: import.meta.env.VITE_FIREBASE_APPID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENTID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(firebaseApp);
const provider = new GoogleAuthProvider();
const db = getFirestore(firebaseApp);
const realtimeDb = getDatabase(firebaseApp);
const storage = getStorage(firebaseApp);

// Function to fetch repairers from Firestore
async function fetchRepairmen() {
    try {
        const repairmenQuery = query(collection(db, 'users'), where('userType', '==', 'repairer'));
        const querySnapshot = await getDocs(repairmenQuery);
        const repairmen = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.businessLocation && data.businessLocation.lat && data.businessLocation.lng) {
                repairmen.push({
                    id: doc.id, // Ensure you store the document ID or uid here
                    name: data.name,
                    lat: data.businessLocation.lat,
                    lng: data.businessLocation.lng
                });
            }
        });
        return repairmen;
    } catch (error) {
        console.error("Error fetching repairmen:", error);
    }
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

        const marker = new AdvancedMarkerElement({
            position: { lat: repairman.lat, lng: repairman.lng },
            map: map,
            title: repairman.name,
            content: customContent
        });

        // Add click event to marker to navigate to the repairer's profile
        google.maps.event.addDomListener(customContent, 'click', () => {
            router.push({ name: 'viewProfile', params: { id: repairman.id } });
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
        u = () => h || (h = new Promise(async (f, n) => {
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
    key: import.meta.env.VITE_GOOGLE_API_KEY,
    v: "weekly",
});

// Authentication and User Management
export function useAuth() {
    const user = ref(null);
    const unsubscribe = auth.onAuthStateChanged(_user => (user.value = _user));
    onUnmounted(unsubscribe);
    const isLogin = computed(() => user.value !== null);

    const signIn = async () => {
        const googleProvider = new GoogleAuthProvider();
        await auth.signInWithPopup(googleProvider);
    };

    const signOut = () => auth.signOut();

    return { user, isLogin, signIn, signOut };
}

// Message Handling
export function useChat() {
    const messages = ref([]);
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        messages.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
    onUnmounted(unsubscribe);

    const { user, isLogin } = useAuth();
    const sendMessage = text => {
        if (!isLogin.value) return;
        const { photoURL, uid, displayName } = user.value;
        messagesCollection.add({
            userName: displayName,
            userId: uid,
            userPhotoURL: photoURL,
            text: text,
            createdAt: FieldValue.serverTimestamp(),
        });
    };

    return { messages, sendMessage };
}

// Vue App Initialization
createApp(App).use(store).use(router).provide('realtimeDB', realtimeDb).mount('#app');

// Export Firebase services
export { firebaseApp, storage, auth, provider, db, signInWithPopup, realtimeDb };
