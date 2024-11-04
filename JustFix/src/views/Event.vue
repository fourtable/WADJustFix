<template>
  
  <div class="container-fluid p-5 mt-4">
    <!-- Header Section -->
    <h1 class="mb-4">Explore our events!</h1>
    <p class="subheader">Upskill, learn DIY skills, and become a better fixer!</p>
    
    <!-- Filters Section -->
    <div class="d-flex align-items-center gap-4 mb-4">
      <!-- Region Filter -->
      <div>
        <label class="filter-title fw-bold d-block mb-1">Region</label>
        <select v-model="selectedRegion" @change="applyFilters" class="form-select">
          <option value="all">All</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="West">West</option>
          <option value="North-East">North-East</option>
          <option value="North-West">North-West</option>
          <option value="South-East">South-East</option>
          <option value="South-West">South-West</option>
          <option value="Central">Central</option>
        </select>
      </div>

      <!-- Price Filter -->
      <div class="col-12 col-sm-6 col-lg-3">
        <label class="filter-title fw-bold d-block mb-1 ">Price</label>
        <div class="d-flex align-items-center input-group">
            <input 
              type="number" 
              class="form-control"
              v-model="priceRange.min"
              placeholder="Min Price"
              min="0"
               @input="applyFilters"
            >
            <span class="input-group-text">to</span>
            <input 
              type="number" 
              class="form-control"
              v-model="priceRange.max"
              placeholder="Max Price"
              :min="priceRange.min"
               @input="applyFilters"
            >
        </div>
      </div>

      <!-- Event Status Filter -->
      <div class="col-12 col-sm-6 col-lg-3">
        <label class="filter-title fw-bold d-block mb-1">Event Status:</label>
        <select v-model="selectedStatus" @change="applyFilters" class="form-select">
          <option value="all">All</option>
          <option value="Open">Open</option>
          <option value="Closing Soon">Closing Soon</option>
        </select>
      </div>

      <!-- Event Date Filter -->
      <div class="col-12 col-sm-6 col-lg-3">
        <label for="eventDate" class="filter-title fw-bold d-block mb-1">Event Date:</label>
        <input type="date" @change="applyFilters" v-model="eventDate" class="form-control" required />
      </div>
    </div>

    <!-- Events Display -->
    <div class="row">
      <div 
        v-for="event in filteredEvents" 
        :key="event.id" 
        class="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center mb-4"
      >
        <EventCard :event="event"  @cardClicked="openModal"/>
      </div>
    </div>
    <EventPopup
      v-if="isModalVisible"
      :event="selectedEvent"
      @close="isModalVisible = false"
    />
    <!-- Apply to Host an Event Section -->
  <div class="organise-info-section">
      <h3>Share Your Skills with the Community</h3>
      <p>
        Are you an experienced repair expert passionate about teaching?
      </p>
      <button @click="redirectToForm" class="btn">Apply to Host an Event</button>
    </div>
  </div>
</template>

<script>
import { db } from "../main"; // Import your Firebase instance
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import EventCard from "../components/eventCard.vue";
import EventPopup from '../components/eventPopup.vue';
import { useRouter } from 'vue-router';

export default {
  components: {
    EventCard,
    EventPopup
  },
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      isModalVisible: false,
      selectedEvent: null,
      nearMe: false,
      priceRange: { min: 0, max: 500 },
      selectedStatus: "all",
      selectedRegion: "all", // Set default to "all"
      eventDate:null,
      userLocation: null,
      events: [], // Stores all events fetched from Firebase
      filteredEvents: [] // Stores events filtered based on selected criteria
    };
  },
  async mounted() {
    await this.fetchEvents();
    this.applyFilters(); // Initial filter application
    // this.initializeGeolocation(); // Fetches user's geolocation if available
  },
  methods: {
    redirectToForm() {
      try {
        // Try with the name first
        this.router.push({ name: 'applyEvent' }).catch(err => {
          // If name doesn't work, try with path
          console.log('Trying alternative route...');
          this.router.push('/ApplyEvent').catch(err => {
            console.error('Navigation failed:', err);
          });
        });
      } catch (error) {
        console.error('Navigation error:', error);
      }
    },
    openModal(event) {
      this.selectedEvent = event;
      this.isModalVisible = true;
    },
    navigateToSignUp(eventId) {
      this.$router.push({ name: 'eventSignup', params: { eventId } });
    },
    async fetchEvents() {
      // Fetch all events from Firestore
      const eventsRef = collection(db, "events");
      const snapshot = await getDocs(eventsRef);
      const geocodedEvents = await Promise.all(snapshot.docs.map(async doc => {
      const event = { id: doc.id, ...doc.data() };
      const coordinates = await this.getCoordinatesFromAddress(event.address);
      event.coordinates = coordinates;
      event.region = this.getRegionFromCoordinates(coordinates);
      return event;
    }));
      this.events = geocodedEvents;
      this.applyFilters();
      console.log("Loaded Events:", this.events);
    },
    async getCoordinatesFromAddress(address) {
    const apiKey = 'AIzaSyAe51tIu9Mpq06AxiZRLbiziX_NH2X6cLw';
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      console.error("Geocoding failed for address:", address);
      return null;
    }
  },
    applyFilters() {
      console.log("Applying Filters:", {
      priceRange: this.priceRange,
      selectedStatus: this.selectedStatus,
      nearMe: this.nearMe,
      eventDate: this.eventDate,
   });
      // Filter based on price
      this.filteredEvents = this.events.filter(event => {
        const matchesPrice = 
          event.price >= this.priceRange.min && 
          event.price <= this.priceRange.max;
        const matchesStatus = this.filterByStatus(event);
        const matchesRegion = this.filterByRegion(event);
      const matchesDate = this.filterByDate(event);


        return matchesPrice && matchesStatus && matchesDate && matchesRegion;
      });
      console.log("Filtered Events:", this.filteredEvents);
    },
    filterByStatus(event) {
      const today = Timestamp.fromDate(new Date());
      if (this.selectedStatus === "all") return true;
      if (this.selectedStatus === "Open") return event.registrationDeadline > today;
      if (this.selectedStatus === "Closing Soon") {
        const twoWeeksLater = Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
        return event.registrationDeadline <= twoWeeksLater && event.registrationDeadline > today;
      }
      return true
    },
    filterByRegion(event) {
      if (this.selectedRegion === "all") return true;
      return event.region === this.selectedRegion;
    },
    getRegionFromCoordinates(coordinates) {
    const { lat, lng } = coordinates;

    // Define approximate lat/lng ranges for each region in Singapore
    if (lat >= 1.35 && lat <= 1.45 && lng >= 103.75 && lng <= 103.85) return "North";
    if (lat >= 1.35 && lat <= 1.45 && lng >= 103.85 && lng <= 103.95) return "North-East";
    if (lat >= 1.30 && lat <= 1.40 && lng >= 103.70 && lng <= 103.80) return "North-West";
    if (lat >= 1.25 && lat <= 1.35 && lng >= 103.75 && lng <= 103.85) return "Central";
    if (lat >= 1.30 && lat <= 1.40 && lng >= 103.90 && lng <= 104.00) return "East";
    if (lat >= 1.25 && lat <= 1.35 && lng >= 103.65 && lng <= 103.75) return "West";
    if (lat >= 1.20 && lat <= 1.30 && lng >= 103.90 && lng <= 104.00) return "South-East";
    if (lat >= 1.20 && lat <= 1.30 && lng >= 103.65 && lng <= 103.75) return "South-West";
    if (lat >= 1.20 && lat <= 1.28 && lng >= 103.75 && lng <= 103.85) return "South";
    return "Unknown";
},
    filterByDate(event) {
      if (!this.eventDate) return true;
      
      // Convert the selected date from input to Timestamp
      const selectedDate = Timestamp.fromDate(new Date(this.eventDate));
      
      // Convert timestamps to Date objects for comparison
      const eventDate = event.eventDate.toDate();
      const inputDate = selectedDate.toDate();
      
      // Set time to start of day for both dates for comparison
      eventDate.setHours(0, 0, 0, 0);
      inputDate.setHours(0, 0, 0, 0);
      
      // Compare the dates
      return eventDate.getTime() === inputDate.getTime();
    }
  }
};
</script>
<style scoped>
.filter-title {
  font-weight: bold;
  font-size: 1rem;
}
.btn {
  padding: 5px 10px;
  border: 1px solid #085c44;
  border-radius: 30px;
  color: #085c44;
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  cursor: pointer;
}
.btn:hover {
  background-color: #085c44;
  color: white;
}
</style>