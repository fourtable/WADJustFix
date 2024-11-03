<template>
  
  <div class="container-fluid p-5 mt-4">
    <!-- Header Section -->
    <h1 class="mb-4">Explore our events!</h1>
    <p class="subheader">Upskill, learn DIY skills, and become a better fixer!</p>
    
    <!-- Filters Section -->
    <div class="d-flex align-items-center gap-4 mb-4">
      <!-- Near Me Filter -->
      <div class="d-flex align-items-center">
        <input type="checkbox" id="nearMe" v-model="nearMe" class="form-check-input" @change="applyFilters">
        <label class="form-check-label" for="nearMe">Near me</label>
      </div>

      <!-- Price Filter -->
      <div>
        <label class="filter-title fw-bold d-block mb-1">Price</label>
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
      <div>
        <label class="filter-title fw-bold d-block mb-1">Event Status:</label>
        <select v-model="selectedStatus" @change="applyFilters" class="form-select">
          <option value="all">All</option>
          <option value="Open">Open</option>
          <option value="Closing Soon">Closing Soon</option>
        </select>
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
      @signUp="navigateToSignUp"
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
      this.$router.push({ name: 'SignUpPage', params: { eventId } });
    },
    async fetchEvents() {
      // Fetch all events from Firestore
      const eventsRef = collection(db, "events");
      const snapshot = await getDocs(eventsRef);
      this.events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Loaded Events:", this.events);
    },
    applyFilters() {
       console.log("Applying Filters:", {
      priceRange: this.priceRange,
      selectedStatus: this.selectedStatus,
      nearMe: this.nearMe,
   });
      // Filter based on price
      this.filteredEvents = this.events.filter(event => {
        const matchesPrice = 
         event.price >= this.priceRange.min && 
         event.price <= this.priceRange.max;

      const matchesStatus = this.filterByStatus(event);

      // Uncomment location filter if using geolocation
      // const matchesLocation = this.filterByLocation(event);

      return matchesPrice && matchesStatus; // && matchesLocation;
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
    // filterByLocation(event) {
    //   if (!this.nearMe || !this.userLocation) return true;
    //   const distance = this.calculateDistance(
    //     this.userLocation.lat,
    //     this.userLocation.lng,
    //     event.location.lat,
    //     event.location.lng
    //   );
    //   return distance <= 10; // Only shows events within 10 km
    // },
    // calculateDistance(lat1, lon1, lat2, lon2) {
    //   const R = 6371; // Radius of the earth in km
    //   const dLat = this.deg2rad(lat2 - lat1);
    //   const dLon = this.deg2rad(lon2 - lon1);
    //   const a =
    //     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //     Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
    //     Math.sin(dLon / 2) * Math.sin(dLon / 2);
    //   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    //   return R * c; // Distance in km
    // },
    // deg2rad(deg) {
    //   return deg * (Math.PI / 180);
    // },
    // initializeGeolocation() {
    //   if (navigator.geolocation) {
    //     navigator.geolocation.getCurrentPosition(
    //       position => {
    //         this.userLocation = {
    //           lat: position.coords.latitude,
    //           lng: position.coords.longitude
    //         };
    //       },
    //       error => {
    //         console.error("Error getting location:", error);
    //       }
    //     );
    //   }
    // }
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