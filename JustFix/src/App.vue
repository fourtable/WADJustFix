<script setup>
import newNavBar from './components/newNavBar.vue';
import notification from './components/notification.vue';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './main'; // Your Firebase setup
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { onMounted, ref } from 'vue';
import store from './store/store'; // Make sure to import your Vuex store

// Function to set up notifications listener
const setupNotificationsListener = (uid) => {
  const notificationsRef = collection(db, 'notifications');
  const notificationsQuery = query(notificationsRef, where('receiverId', '==', uid));

  onSnapshot(notificationsQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const notificationData = change.doc.data();
        console.log('New Notification:', notificationData); // Log the notification
        store.dispatch('addNotification', {
          message: notificationData.message,
          timestamp: notificationData.timestamp
        });
      }
    });
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
  const testNotification = {
    message: "Test notification!",
    timestamp: new Date().toISOString(),
  };
  store.dispatch('addNotification', testNotification); // Test dispatch
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
    <notification />
  </main>
</template>

<style>
.content {
  padding-top: 3%;
  /* Adjust this based on your navbar height */
  margin-bottom: 5%;
}
</style>
