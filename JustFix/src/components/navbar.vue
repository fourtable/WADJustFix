<template>
  <nav class="navbar navbar-expand-md">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <img src="../assets/newlogo.png" alt="JusFix Logo" width="120" height="60"
          class="d-inline-block align-text-top" />
      </a>
      <button class="navbar-toggler bg-success" type="button" data-bs-toggle="collapse" data-bs-target="#navbar"
        aria-controls="navbar" aria-expanded="false" aria-label="Menu">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse mx-auto" id="navbar">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <router-link class="nav-link fw-bold" :to="{ name: 'home' }">Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link fw-bold" :to="{ name: 'event' }">Event</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link fw-bold" :to="{ name: 'repair' }">Repairers</router-link>
          </li>
        </ul>

        <!-- Login and Register Buttons -->
        <ul v-if="!username" class="nav-buttons navbar-nav ms-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <router-link :to="{ name: 'login' }" class="btn btn-dark d-md-inline d-none" role="button">Login</router-link>
            <router-link :to="{ name: 'login' }" class="nav-link d-md-none fw-bold" role="button">Login</router-link>
          </li>
          <li class="nav-item">
            <router-link :to="{ name: 'register' }" class="btn btn-dark d-md-inline d-none"
              role="button">Register</router-link>
            <router-link :to="{ name: 'register' }" class="nav-link d-md-none fw-bold"
              role="button">Register</router-link>
          </li>
        </ul>

        <!-- Profile Icon -->
        <div v-else class="dropdown">
          <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
            data-bs-toggle="dropdown" aria-expanded="false">{{ username }}
            <img :src="person" alt="Profile" class="d-inline-block align-text-top" width="30" height="30" />
          </button>
          <ul class="dropdown-menu dropdown-menu-start" aria-labelledby="dropdownMenuButton">
            <li>
              <router-link class="dropdown-item" :to="{ name: 'profile' }">Profile</router-link>
            </li>
            <li>
              <router-link class="dropdown-item btn" @click="logout" >Logout</router-link>
              <!-- Logout Option -->
            </li>
          </ul>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import Cookies from 'js-cookie'
export default {
  data() {
    return {
      username: '', // Add username data property
      person: '../assets/defaultProfile.png' // Update with the actual default profile image path
    }
  },
  created() {
    // Retrieve username from cookies and assign it to the username data property
    this.username = Cookies.get('username') || ''; // Assign cookie value or empty string if not found
  },
  methods: {
    // Define methods for interactivity, e.g., logout function
    logout() {
      console.log('User logged out');
      // You can implement actual logout logic here
      Cookies.remove('username');

      // Clear the username in Vuex store
      this.$store.dispatch('updateUserName', '');

      window.location.href = '/login';
    }
  }
}
</script>