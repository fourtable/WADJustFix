<script setup>
import Navbar from './components/navbar.vue'
import newNavBar from './components/newNavBar.vue';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './main'; // Your Firebase setup
import { doc, getDoc } from 'firebase/firestore';
import Cookies from 'js-cookie'
</script>

<template>
  <div>
    <!-- <Navbar :profileImage="userData.imageUrl"></Navbar> -->
    <newNavBar :profileImage="userData.imageUrl"/>
  </div>
  <main class="content">
    <router-view/>
  </main>
</template>

<script>
export default {
  components: {
    Navbar,
    newNavBar,
  },
  data() {
    return {
      userData: {
        imageUrl: '',
      },
      isAuthenticated: false, // Set to false by default (logged out)
    };
  },
  mounted() {
    const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
    if (uid) {
      this.isAuthenticated = true; // Set as logged in if uid exists
      this.fetchUserData(uid);
      
      // Listen for auth state changes in case user logs out
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.fetchUserData(user.uid);
        } else {
          this.isAuthenticated = false; // Reset to logged out
          this.userData = { imageUrl: '' }; // Clear user data
        }
      });
    }
    else{
      signOut(auth);
    }
  },
  methods: {
    async fetchUserData(uid) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        this.userData = userDoc.data();
      }
    },
  },
};
</script>
<style>
.content {
  padding-top: 3%; /* Adjust this based on your navbar height */
  margin-bottom: 5%;
}
</style>