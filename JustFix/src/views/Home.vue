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
            <input type="text" class="form-control" id="locationInput" placeholder="Enter location..." ref="locationInput" />
            <!-- Search radius slider -->
            <label for="radiusSlider" class="mt-3">Search Radius (km): {{ searchRadius }} km</label>
            <input type="range" id="radiusSlider" v-model="searchRadius" min="1" max="50" class="form-range" />
            <div id="map" class="map-container mt-3"></div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { db } from "../main";
import { query, collection, where, getDocs } from "firebase/firestore"; // Import Firestore methods

export default {
  data() {
    return {
      searchQuery: '', // Holds location search query
      repairLink: '#', // Define your links
      registerLink: '#',
      eventLink: '#',
      searchRadius: 10, // Default search radius in km
      allRepairmen: [], // Store all repairers
      repairmenMarkers: [], // For storing markers on the map
      map: null, // Reference to the map instance
      locationInput: null, // Reference to location input field
      selectedLocation: null, // Stores the selected location lat/lng
      userLocation: null, // Stores the user's current geolocation
      searchCircle: null, // Circle on the map to represent search radius
    };
  },
  mounted() {
    this.initMap();
    this.initializeAutocomplete(); // Initialize Google Places Autocomplete on mount
    this.getUserLocation(); // Get the user's geolocation on mount
  },
  watch: {
    // Watch for changes in radius and trigger a map update
    searchRadius() {
      this.updateSearchCircle(); // Update the circle radius in real-time
      this.filterRepairersByLocation(); // Refilter repairers based on updated radius
    },
  },
  methods: {
    async fetchRepairers() {
      const q = query(collection(db, 'users'), where('userType', '==', 'repairer'));
      const querySnapshot = await getDocs(q);
      const repairmen = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.businessLocation && data.businessLocation.lat && data.businessLocation.lng) {
          repairmen.push({
            name: data.name,
            lat: data.businessLocation.lat,
            lng: data.businessLocation.lng,
          });
        }
      });
      this.allRepairmen = repairmen; // Save all repairers for future filtering
      return repairmen;
    },
    async initMap() {
      const { Map } = await google.maps.importLibrary("maps");

      // Define bounds for Singapore
      const singaporeBounds = {
        north: 1.477,
        south: 1.130,
        west: 103.609,
        east: 104.028,
      };

      this.map = new Map(document.getElementById('map'), {
        center: { lat: 1.3521, lng: 103.8198 }, // Singapore center
        zoom: 12,
        restriction: {
          latLngBounds: singaporeBounds, // Restrict to Singapore bounds
          strictBounds: false, // Set to true if you want to disallow any panning outside the bounds
        },
        mapId: 'your-map-id', // Replace with your map ID if you have one
      });

      google.maps.event.trigger(this.map, "resize");

      const repairmen = await this.fetchRepairers();
      this.placeRepairmenOnMap(repairmen); // Show all repairers by default
    },

    placeRepairmenOnMap(repairmen) {
      this.clearMarkers(); // Clear any existing markers before adding new ones
      repairmen.forEach((repairman) => {
        const marker = new google.maps.Marker({
          position: { lat: repairman.lat, lng: repairman.lng },
          map: this.map,
          title: repairman.name, // Display repairman's name when hovering over marker
        });
        this.repairmenMarkers.push(marker); // Store the marker
      });

      this.adjustMapBounds(repairmen); // Adjust the map bounds based on repairmen
    },

    clearMarkers() {
      this.repairmenMarkers.forEach((marker) => marker.setMap(null));
      this.repairmenMarkers = [];
    },

    // Initialize Google Places Autocomplete
    initializeAutocomplete() {
      const { Autocomplete } = google.maps.places;
      const input = this.$refs.locationInput;
      const autocomplete = new Autocomplete(input);

      // Set bounds for Singapore to narrow down location searches
      autocomplete.setComponentRestrictions({
        country: ["sg"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          this.selectedLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          this.map.setCenter(this.selectedLocation); // Move map to selected location
          this.map.setZoom(15); // Zoom into the selected location
          this.updateSearchCircle(); // Create or update the search circle
          this.filterRepairersByLocation(); // Filter repairers based on the selected location
        } else {
          // Reset to show all repairmen if the input is cleared or no location is selected
          this.placeRepairmenOnMap(this.allRepairmen);
        }
      });
    },

    // Geolocation: Get user's current location
    getUserLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            this.map.setCenter(this.userLocation); // Center map on user's location
            this.map.setZoom(14); // Adjust zoom level for user location
            this.placeUserLocationMarker(); // Place a marker for the user’s location
            this.placeRepairmenOnMap(this.allRepairmen); // Show all repairmen by default
            this.updateSearchCircle(); // Create or update the search circle for the user's location
          },
          (error) => {
            console.error("Error fetching user location:", error.message);
            // If geolocation fails, show all repairmen by default
            this.placeRepairmenOnMap(this.allRepairmen);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        // If geolocation is not supported, show all repairmen by default
        this.placeRepairmenOnMap(this.allRepairmen);
      }
    },

    // Place marker on user's current location
    placeUserLocationMarker() {
      if (this.userLocation) {
        new google.maps.Marker({
          position: this.userLocation,
          map: this.map,
          title: "You are here!",
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Blue marker to represent user
          },
        });
      }
    },

    // Filter repairers based on the selected location proximity (within the specified radius)
    filterRepairersByLocation() {
      const location = this.selectedLocation || this.userLocation;
      if (!location) {
        // If no location is selected, show all repairmen
        this.placeRepairmenOnMap(this.allRepairmen);
        return;
      }

      const filteredRepairmen = this.allRepairmen.filter((repairman) => {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(location.lat, location.lng),
          new google.maps.LatLng(repairman.lat, repairman.lng)
        );
        return distance <= this.searchRadius * 1000; // Filter by the radius in meters
      });

      this.placeRepairmenOnMap(filteredRepairmen); // Show filtered repairmen
    },

    // Create or update the search circle to represent the search radius
    // Create or update the search circle to represent the search radius
    updateSearchCircle() {
      const location = this.selectedLocation || this.userLocation;
      if (!location) return;

      if (this.searchCircle) {
        this.searchCircle.setMap(null); // Remove the previous circle
      }

      this.searchCircle = new google.maps.Circle({
        center: location,
        radius: this.searchRadius * 1000, // Radius in meters
        map: this.map,
        fillColor: "#ADD8E6",
        fillOpacity: 0.10, // Reduce fill opacity to make it less intrusive
        strokeColor: "#FF0000", // Set the stroke color to match the fill
        strokeOpacity: 0.5, // Set the stroke opacity to make it stand out but not block the map
        strokeWeight: 2, // Thin stroke for better visibility
      });

      this.map.fitBounds(this.searchCircle.getBounds()); // Adjust map bounds to fit the circle
    }

    ,

    // Adjust map bounds to fit all repairmen markers
    adjustMapBounds(repairmen) {
      const bounds = new google.maps.LatLngBounds();
      repairmen.forEach((repairman) => {
        bounds.extend({ lat: repairman.lat, lng: repairman.lng });
      });
      this.map.fitBounds(bounds); // Fit the map to the bounds of the repairmen markers
    },
  },
};
</script>

<style>
.map-container {
  width: 100%;
  aspect-ratio: 2 / 1;
  height: 400px; /* Adjust as needed */
  display: flex;
  margin: auto;
  margin-bottom: 10%;
}

#map {
  flex: 1; /* Ensure #map fills the .map-container */
  height: 90%; /* Full height of .map-container */
}
</style>
