<template>

  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div class="row">
        <!-- First Hero Box -->
        <div class="col-lg-6 col-md-6 col-sm-12 my-3">
          <div class="hero-box light-blue">
            <h1>Need Something Fixed?</h1>
            <p>Chat with a repairer and get a quick quote for your repair!</p>
            <a :href="repairLink" class="button">Browse Trusted Repairers &rarr;</a>
          </div>
        </div>
        <!-- Second and Third Hero Boxes -->
        <div class="col-lg-6 col-md-6 col-sm-12 my-3">
          <div class="hero-box light-green">
            <h2>Join Us As a Repairer!</h2>
            <p>Whether you're a repair hobbyist or a professional repairer, we welcome you!</p>
            <a :href="registerLink" class="button">Register Now &rarr;</a>
          </div>
          <div class="col-12 hero-box dark-green mt-4">
            <h2>Discover Our Repair Events</h2>
            <p>Attend our events to learn DIY repair techniques or upskill as a repairer.</p>
            <a :href="eventLink" class="button">Learn More &rarr;</a>
          </div>
        </div>

        <!-- Map Section -->
        <div class="row mt-5">
          <div class="col-12 mb-3">
            <!-- Search bar for location -->
            <input type="text" class="form-control" id="locationInput" placeholder="Enter location..."
              ref="locationInput" />
            <!-- Search radius slider -->
            <label for="radiusSlider" class="mt-3">Search Radius (km): {{ searchRadius }} km</label>
            <input type="range" id="radiusSlider" v-model="searchRadius" min="1" max="50" class="form-range" />
            <div id="map" class="map-container mt-3"></div>
          </div>
        </div>

        <!-- repairmenListings -->
        <RepairmenCards :repairmen="repairmen" />
      </div>
    </div>




  </section>
</template>

<script setup>

import { ref, computed, onMounted, watch } from 'vue';
import { initializeMap, fetchRepairers, placeRepairmenOnMap, updateSearchCircle as updateMapSearchCircle } from '../plugins/googleMaps';
import store from "../store/store.js";
// import NavBar from "../components/newNavBar";
import RepairmenCards from "../components/repairmenCards.vue";

// Reactive properties
const searchQuery = ref('');
const searchRadius = ref(10); // Default search radius in km
const userLocation = ref(null); // Stores the user's current geolocation
const allRepairmen = ref([]); // Store all repairers

// Computed properties
const username = computed(() => store.getters.getUserName);
const repairmen = computed(() => store.getters.getRepairmen);

// Watchers
watch(searchRadius, () => {
  updateSearchCircle();
  filterRepairersByLocation();
});

// Lifecycle hooks
onMounted(() => {
  getUserLocation();
});

// Methods
async function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        initializeMapAndFetchRepairers();
      },
      (error) => {
        console.error("Error fetching user location:", error.message);
        initializeMapAndFetchRepairers(); // Proceed without user location
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
    initializeMapAndFetchRepairers(); // Proceed without user location
  }
}


async function initializeMapAndFetchRepairers() {
  await initializeMap('map', userLocation.value);
  await store.dispatch('fetchRepairmen');
  allRepairmen.value = await fetchRepairers();
  placeRepairmenOnMap(allRepairmen.value);
  updateMapSearchCircle(userLocation.value, searchRadius.value); // Use the imported function for updating the search circle
  console.log(userLocation.value);
}

function updateSearchCircle() {
  const location = userLocation.value;
  if (location) {
    updateMapSearchCircle(location, searchRadius.value); // Call the update function
  }
}

function filterRepairersByLocation() {
  const location = userLocation.value;
  // Implement your filtering logic based on user location and search radius here
}

// Top skills method
function topSkills(expertise) {
  return expertise ? expertise.slice(0, 3) : [];
}
</script>


<style>
.map-container {
  width: 100%;
  aspect-ratio: 2 / 1;
  height: 400px;
  /* Adjust as needed */
  display: flex;
  margin: auto;
  margin-bottom: 10%;
}

#map {
  flex: 1;
  /* Ensure #map fills the .map-container */
  height: 60%;
  /* Full height of .map-container */
}
</style>
