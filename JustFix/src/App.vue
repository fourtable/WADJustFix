<script setup>
import Navbar from './components/navbar.vue'
import newNavBar from './components/newNavBar.vue';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './main'; // Your Firebase setup
import { doc, getDoc } from 'firebase/firestore';
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
    };
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.fetchUserData(user.uid);
      }
    });
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
  padding-top: 60px; /* Adjust this based on your navbar height */
}
</style>