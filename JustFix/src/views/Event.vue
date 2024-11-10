<template>
  <div class="container-fluid p-5 mt-4">
    <!-- Header Section -->
    <h1 class="mb-4">Explore our events!</h1>
    <p class="subheader">Upskill, learn DIY skills, and become a better fixer!</p>
    <!-- Filters Section -->
    <div class="d-flex align-items-center flex-wrap gap-4 mb-4">
      <!-- Region Filter -->
      <div  class="filter-item col-12 col-md-6 col-lg-3">
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

      <!-- Event Status Filter -->
      <div  class="filter-item col-12 col-md-6 col-lg-3">
        <label class="filter-title fw-bold d-block mb-1">Event Status:</label>
        <select v-model="selectedStatus" @change="applyFilters" class="form-select">
          <option value="all">All</option>
          <option value="Open">Open</option>
          <option value="Closing Soon">Closing Soon</option>
        </select>
      </div>

      <!-- Event Date Filter -->
      <div  class="filter-item col-12 col-md-6 col-lg-3">
        <label for="eventDate" class="filter-title fw-bold d-block mb-1">Event Date:</label>
        <div class="d-flex align-items-center input-group">
          <input
            type="date"
            v-model="startDate"
            :min="today"
            @change="applyFilters"
            class="form-control"
            placeholder="Start Date"
          >
          <span class="input-group-text">to</span>
          <input
            type="date"
            v-model="endDate"
            :min="today"
            @change="applyFilters"
            class="form-control"
            placeholder="End Date"
          >
        </div>
      </div>
    </div>

    <!-- Events Display -->
    <div v-if="filteredEvents.length === 0" class="text-center py-4">
      <p>No events found matching your criteria.</p>
    </div>

    <div v-else class="row">
      <div 
        v-for="event in filteredEvents" 
        :key="event.id" 
        class="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center mb-4"
      >
        <EventCard :event="event" :signedUpEventIds="signedUpEventIds" @cardClicked="openModal(event)"/>
      </div>
    </div>

    <!--modal/popoup-->
    <Teleport to="body">
      <div v-if="isModalVisible && selectedEvent" class="modal-overlay">
        <div class="modal-content">
          <EventPopup
            :event="selectedEvent"
            :user="currentUser"
            :signedUpEventIds="signedUpEventIds" 
            :canSignUp="canSignUp"
            @close="closeModal"
            @openEventSignup="navigateToSignup"
          />
        </div>
      </div>
    </Teleport>
    
    <!-- Apply to Host an Event Section -->
  <div class="organise-info-section">
      <h3>Share Your Skills with the Community</h3>
      <p>
        Are you an experienced repair expert passionate about teaching?
      </p>
      <button @click="handleApplyClick" class="btn">Apply to Host an Event</button>
    </div>
  </div>
</template>

<script>
import { db,storage } from "../main"; // Import your Firebase instance
import { collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import EventCard from "../components/eventCard.vue";
import EventPopup from '../components/eventPopup.vue';
import { useRouter } from 'vue-router';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, onMounted } from 'vue';
import Cookies from 'js-cookie';

export default {
  components: {
    EventCard,
    EventPopup
  },
  setup() {
    const router = useRouter();
    const auth = getAuth();

    // Define a reactive variable to store login status
    const isLoggedIn = ref(false);
    // Check authentication state using both Firebase and stored credentials
    const checkAuthState = () => {
      const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
      const firebaseUser = auth.currentUser;
      
      isLoggedIn.value = !!(uid || firebaseUser);
    };
    // Listen to authentication state changes
    onAuthStateChanged(auth, () => {
      checkAuthState();
    });
    // Check auth state when component mounts
    onMounted(() => {
      checkAuthState();
    });
    const handleApplyClick = () => {
      const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
      if (!uid) {
          // Store current path for redirect after login
          sessionStorage.setItem('intendedPath', '/ApplyEvent');
          router.push('/login');
      } else {
          router.push('/ApplyEvent');
      }
    };
    return {
      handleApplyClick,
      isLoggedIn
    }

  },
  data() {
    return {
      isModalVisible: false,
      selectedEvent: null,
      selectedStatus: "all",
      selectedRegion: "all", // Set default to "all"
      startDate: null,
      endDate: null,
      userLocation: null,
      events: [], // Stores all events fetched from Firebase
      filteredEvents: [], // Stores events filtered based on selected criteria
      currentUser: this.$store.state.user || {
      uid: Cookies.get('uid') || sessionStorage.getItem('uid'),
      email: Cookies.get('email') || sessionStorage.getItem('email'),
      name: Cookies.get('username') || sessionStorage.getItem('username'),
      signedUpEventIds: [], // List of event IDs the user is signed up for
      upcomingSignedUpCount: 0, // Tracks the count of upcoming signed-up events
      canSignUp: true, // Determines if the "Sign Up" button should appear
    },
    };
  },
  computed: {
    today() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
  },
  async mounted() {
    await this.fetchEvents();
    await this.fetchSignedUpEvents();
    await this.applyFilters();
  
  },
  methods: {
    async fetchSignedUpEvents() {
      try{
      const userId = this.currentUser.uid; // Ensure user is logged in
      console.log(userId);
      if (userId) {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        const signedUpEvents = userDoc.exists() ? userDoc.data().signedUpEvents || [] : [];
        // Calculate upcoming signed-up events count
        const now = new Date();
          this.upcomingSignedUpCount = signedUpEvents.filter(event => {
            const eventDate = event.eventDate.toDate ? event.eventDate.toDate() : new Date(event.eventDate);
            return eventDate > now; // Count only upcoming events
          }).length;

        // Update canSignUp based on count
        this.canSignUp = this.upcomingSignedUpCount < 5;
        this.signedUpEventIds = signedUpEvents.map(event => event.eventId);
        console.log('signed up events id', this.signedUpEventIds)
    }
    }  catch (error) {
    console.error("Error fetching signed-up events:", error);
  }
  },
    openModal(event) {
      this.selectedEvent = { ...event };
      this.isModalVisible = true;
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    },
    closeModal() {
      this.isModalVisible = false;
      this.selectedEvent = null;
      document.body.style.overflow = 'auto'; // Restore scrolling
    },
    navigateToSignup({ event, user }) {
      if (event && user) {
      this.$store.commit('setEventData', event);
      this.$store.commit('setUserData', user);

      sessionStorage.setItem('eventData', JSON.stringify(event));
      sessionStorage.setItem('userData', JSON.stringify(user));

      this.$router.push({ name: 'eventSignup', params: { eventId: event.id } });
    } else {
      console.warn("Event or User data is missing in navigateToSignup");
    }
    },
    async fetchEvents() {
      // Fetch all events from Firestore
      const eventsRef = collection(db, "events");
      const snapshot = await getDocs(eventsRef);

      const geocodedEvents = await Promise.all(
        snapshot.docs.map(async doc => {
        const event = { id: doc.id, ...doc.data() };
        console.log(event.address);

        try {
          const coordinates = await this.getCoordinatesFromAddress(event.address); // Await here
          if (coordinates) {
            event.coordinates = coordinates;
            event.region = await this.getRegionFromCoordinates(coordinates);
            console.log(event.region);
          } else {
            console.error("No coordinates found for address:", event.address);
          }
        } catch (error) {
          console.error("Error fetching coordinates:", error);
        }

        return event; // Return event regardless of whether geocoding succeeded
      }));
      this.events = geocodedEvents;
      this.applyFilters();
      console.log("Loaded Events:", this.events);
    },
    async getCoordinatesFromAddress(address) {
      //check if address exists
      if (!address) {
        console.log("No address provided for event");
        return null;
      }
      try {
        const apiKey = 'AIzaSyAe51tIu9Mpq06AxiZRLbiziX_NH2X6cLw';
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`);
        const data = await response.json();
        if (data.results?.[0]?.geometry?.location) {
          return data.results[0].geometry.location;
        }
        return null;
      } catch (error) {
        console.error("Error geocoding address:", error);
        return null;
      }
  },
    applyFilters() {
      console.log("Applying Filters:", {
      selectedStatus: this.selectedStatus,
      region: this.selectedRegion,
      dates: { start: this.startDate, end: this.endDate }
      });
      // Filter based on price
      this.filteredEvents = this.events.filter(event => {
        const hasVacantSlots = event.vacantSlots > 0; // Check if event has vacant slots
        const matchesStatus = this.filterByStatus(event);
        const matchesRegion = this.filterByRegion(event);
        const matchesDate = this.filterByDateRange(event);


        return  hasVacantSlots && matchesStatus && matchesDate && matchesRegion;
      });
      console.log("Filtered Events:", this.filteredEvents);
    },
    filterByStatus(event) {
      const deadline = event.registrationDeadline;
      const now = new Date();
      const deadlineDate = deadline && typeof deadline.toDate === 'function' 
        ? deadline.toDate() 
        : deadline; // Use it directly if it's already a Date or another type

      if (!deadlineDate) return false;

      if (this.selectedStatus === "all") {
        return deadlineDate > now;
      };
      if (this.selectedStatus === "Open") {
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
        return deadlineDate >= twoWeeksFromNow;
      }
      if (this.selectedStatus === "Closing Soon") {
        const twoWeeksFromNow = new Date();
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
        return deadlineDate <= twoWeeksFromNow && deadlineDate > now;
      }
      return false;
    },
    filterByRegion(event) {
      if (this.selectedRegion === "all") return true;
      console.log("region assignment", event.region, this.selectedRegion)
      return event.region === this.selectedRegion;
    },
    filterByDateRange(event) {
      if (!this.startDate && !this.endDate) return true;
      if (!event.eventDate) return false;

      // Convert Firebase Timestamp to Date if necessary
      const eventDate = event.eventDate.toDate ? event.eventDate.toDate() : new Date(event.eventDate);
      const formattedEventDate = new Date(eventDate.toDateString());
      const startDate = this.startDate ? new Date(new Date(this.startDate).toDateString()) : null;
      const endDate = this.endDate ? new Date(new Date(this.endDate).toDateString()) : null;

      console.log("Event Date:", formattedEventDate);
      console.log("Start Date:", startDate);
      console.log("End Date:", endDate);


      if (startDate && !endDate) return formattedEventDate >= startDate;
      if (!startDate && endDate) return formattedEventDate <= endDate;
      return formattedEventDate >= startDate && formattedEventDate <= endDate;
    },
    async getRegionFromCoordinates(coordinates) {
      // Check if coordinates exist
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        return "Unknown";
      }
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
}
};
</script>

<style scoped>
.filter-title {
  font-weight: bold;
  font-size: 1rem;
}
.filter-item {
  max-width: 100%;
}
@media (min-width: 768px) {
  .filter-item {
    max-width: 250px; /* Consistent width across all filters on larger screens */
  }
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
