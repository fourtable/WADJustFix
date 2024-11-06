<script setup>
import newNavBar from './components/newNavBar.vue';
import toast from './components/toast.vue';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, realtimeDb } from './main'; // Firebase setup
import { doc, getDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { onMounted, ref } from 'vue';
import { ref as dbRef, onValue, getDatabase, set, onDisconnect } from 'firebase/database';

// Reactive user data
const userData = ref({
  imageUrl: '',
});

const uid = Cookies.get('uid') || sessionStorage.getItem('uid');

if(uid){
  setOnlineStatus(uid);
}

function setOnlineStatus(userId) {
    const db = getDatabase();
    const statusRef = dbRef(db, `status/${userId}`);

    // Set the user's status to online
    set(statusRef, {
        state: "online",
        lastChanged: Date.now()
    });

    // Automatically set the status to offline when the user disconnects
    onDisconnect(statusRef).set({
        state: "offline",
        lastChanged: Date.now()
    });
}

// Function to set up notifications listener
const notificationsList = ref([]);

const setupNotificationsListener = (uid) => {
  const notificationsRef = dbRef(realtimeDb, `notifications/${uid}`);

  onValue(notificationsRef, (snapshot) => {
    const notifications = snapshot.val(); // Get all notifications
    if (notifications) {
      notificationsList.value = []; // Clear previous notifications
      Object.entries(notifications).forEach(([id, notificationData]) => {
        notificationsList.value.push({
          id,
          message: notificationData.message,
          name: notificationData.senderName,
          timestamp: notificationData.timestamp,
          isVisible: true,
        });
      });
    }
  });
};

// Function to fetch user data
async function fetchUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      userData.value = userDoc.data(); // Update userData if it exists
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
}

// Get uid from cookies or session storage
if (uid) {
  setupNotificationsListener(uid); // Set up listener for notifications
  fetchUserData(uid); // Fetch user data if logged in
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    fetchUserData(user.uid); // Fetch user data if logged in
  } else {
    signOut(auth);
  }
});

onMounted(() => {
  if (uid) {
    fetchUserData(uid); // Fetch user data on mount if logged in
  }
});
</script>

<template>
  <div>
    <!-- Pass the user image to the NavBar -->
    <newNavBar :profileImage="userData.imageUrl" />
  </div>
  <main class="content">
    <!-- The router view where components are dynamically loaded -->
    <router-view />
    <!-- Toast notifications -->
    <toast :notifications="notificationsList" />
  </main>
</template>

<style>
.content {
  padding-top: 3%;
  margin-bottom: 5%;
  /* Adjust padding and margin to account for the navbar */
}
</style>
