<script setup>
import newNavBar from './components/newNavBar.vue';
import toast from './components/toast.vue';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, realtimeDb } from './main'; // Your Firebase setup
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { onMounted, ref } from 'vue';
import { ref as dbRef, onValue } from 'firebase/database';

// Function to set up notifications listener
const notificationsList = ref([]);

// Function to set up notifications listener
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


// Handle user authentication and notifications
const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
if (uid) {
  setupNotificationsListener(uid); // Set up listener for notifications
}

onMounted(() => {
  if (uid) {
    fetchUserData(uid); // Fetch user data if logged in
  }
});

// Function to fetch user data
async function fetchUserData(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    userData.value = userDoc.data(); // Update userData if it exists
  }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    fetchUserData(user.uid);
  } else {
    signOut(auth);
  }
});

// Reactive user data
const userData = ref({
  imageUrl: '',
});

</script>

<template>
  <div>
    <newNavBar :profileImage="userData.imageUrl" />
  </div>
  <main class="content">
    <router-view />
    <toast />
  </main>
</template>

<style>
.content {
  padding-top: 3%;
  /* Adjust this based on your navbar height */
  margin-bottom: 5%;
}
</style>
