<template>
  <div class="container mt-5">
    <!-- Header Section -->
    <div class="d-flex justify-content-between align-items-center">
      <div>
        <h1 class="mb-1">Explore our events!</h1>
        <p class="subheader">Upskill, learn DIY skills, and become a better fixer!</p>
      </div>
      <!-- Filter Button -->
      <button class="btn " @click="toggleFilter">
        Filter
      </button>
    </div>

    <!-- Filter Popup Section -->
    <div v-if="showFilter"  class="filter-overlay">
      <div class="filter-content">
        <!-- Close button -->
        <div class="d-flex justify-content-end mb-3">
          <button class="btn-close" @click="toggleFilter"></button>
        </div>

        <h4 class="fw-bold mb-4">Filters</h4>

        <!-- Expertise Filter -->
        <div class="mb-4 filter-section">
          <label class="filter-title fw-bold mb-2">Category</label>
          <div id="expertiseOptions">
            <div v-for="(expertise, index) in expertiseList" :key="index" class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                :id="'category_' + index" 
                :value="expertise" 
                v-model="filters.category"
              >
              <label class="form-check-label" :for="'category_' + index">{{ expertise }}</label>
            </div>
            <div class="form-check">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="other" 
                v-model="filters.otherChecked"
              >
              <label class="form-check-label" for="other">Others (please specify)</label>
              <input 
                v-if="filters.otherChecked" 
                type="text" 
                v-model="filters.otherCategory" 
                class="form-control mt-2" 
                placeholder="Enter a category"
              >
            </div>
          </div>
        </div>

        <!-- Where Filter -->
        <div class="mb-4 filter-section">
          <label class="filter-title fw-bold mb-2">Where?</label>
          <div class="form-check">
            <input type="checkbox" id="nearMe" v-model="filters.where" class="form-check-input">
            <label class="form-check-label ms-2" for="nearMe">Near me</label>
          </div>
        </div>

      <!-- Price Range Filter -->
      <div class="mb-4 filter-section">
        <label class="filter-title fw-bold mb-2">Price</label>
        <div class="input-group">
            <input 
              type="number" 
              class="form-control"
              v-model="filters.priceRange.min"
              placeholder="Min Price"
              min="0"
            >
            <span class="input-group-text">to</span>
            <input 
              type="number" 
              class="form-control"
              v-model="filters.priceRange.max"
              placeholder="Max Price"
              :min="filters.priceRange.min"
            >
        </div>
      </div>

      <!-- Event Status Filter -->
      <div class="mb-4 filter-section">
        <label class="filter-title fw-bold mb-2">Event Status</label>
        <div class="d-flex gap-2 status-buttons">
            <button 
              v-for="status in eventStatuses" 
              :key="status"
             
               :class="['btn', 'status-button', { 'active': filters.status.includes(status) }]"
              @click="toggleStatus(status)"
            >
              {{ status }}
            </button>
          </div>
      </div>

      <!-- Event Date Filter -->
      <div class="mb-4 filter-section">
        <label class="filter-title fw-bold mb-2">Event Date</label>
        <div class="input-group">
            <input 
              type="date" 
              class="form-control"
              v-model="filters.date.start"
              :min="today"
            >
            <span class="input-group-text">to</span>
            <input 
              type="date" 
              class="form-control"
              v-model="filters.date.end"
              :min="filters.date.start || today"
            >
        </div>
      </div>

      <!-- Apply and Reset Buttons -->
      <div class="d-flex justify-content-end mt-3">
        <button class="btn me-2" @click="resetFilters">Reset</button>
        <button class="btn " @click="applyAndClose">Apply</button>
      </div>
    </div>
  </div>

<!-- Event Cards Section -->
  <div class="row mt-4">
    <div class="col-md-4 mb-3" v-for="event in filteredEvents" :key="event.id">
      <EventCard :event="event" />
    </div>
  </div>
  </div>
</template>

<script>
import { db } from "../main"; // Import your Firebase instance
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import EventCard from "../components/eventCard.vue";

export default {
  components: {
    EventCard
  },
  data() {
    return {
      showFilter: false,
      eventStatuses: ['Open', 'Closing Soon'],
      filters: {
        where: false,
        priceRange: { min: 0, max: 500 },
        status: [],
        date: {
          start: '',
          end: ''
        },
        category: [],
        otherChecked: false,
        otherCategory: ''
      },  
      expertiseList: [
        "Home Appliances (e.g Microwaves, Washing Machines, etc.)",
        "Electrical Systems and Fixtures (e.g Lighting, Wiring, etc.)",
        "Electronics Repair (e.g Devices, TVs, etc.)",
        "Plumbing (e.g Toilets, Heaters, etc.)",
        "Air Conditioners (e.g Repairing, Maintaining, etc.)",
        "Furnitures (e.g Shelves, Tables, etc.)",
        "Windows and Doors (e.g Locks, Window Frames, etc.)",
        "Automative Repairs (e.g Tires, Brakes, etc.)"
      ],
      maxDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      filteredEvents: []
    };
  },
  computed: {
    today() {
      return new Date().toISOString().split('T')[0];
    }
  },
  methods: {
    toggleFilter() {
      this.showFilter = !this.showFilter;
      if (this.showFilter) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    },
    toggleStatus(status) {
      const index = this.filters.status.indexOf(status);
      if (index === -1) {
        this.filters.status.push(status);
      } else {
        this.filters.status.splice(index, 1);
      }
    },
    async applyAndClose() {
      await this.applyFilters(); //fetch and apply the filters
      this.toggleFilter();
    },
    async applyFilters() {
      const selectedCategory = this.filters.category.map(category =>
        category.replace(/\s*\(.*?\)/, '').trim()
      );
      if (this.filters.otherChecked && this.filters.category) {
        selectedCategory.push(this.filters.otherCategory);
      }

      const selectedFilters = {
        where: this.filters.where,
        priceRange: this.filters.priceRange,
        status: this.filters.status,
        date: this.filters.date,
        category: selectedCategory
      };
      console.log("Applied Filters:", selectedFilters);

       // Fetch filtered events from Firebase
       this.filteredEvents = await this.fetchFilteredEvents(selectedFilters);
      console.log("Filtered Events:", this.filteredEvents);
    },
    async fetchFilteredEvents(filters) {
      const eventsRef = collection(db, "events");
      const today = Timestamp.fromDate(new Date());
      let q = query(eventsRef);

      // Filter based on location (if using geolocation features in future)
      if (filters.where?.nearMe) {
        q = query(q, where("locationName", "==", filters.locationName)); // Placeholder, adapt as needed
      }

      // Filter based on price range
      if (filters.priceRange.min !== null && filters.priceRange.max !== null) {
        q = query(q, where("price", ">=", filters.priceRange.min), where("price", "<=", filters.priceRange.max));
      }

      // Filter by category
      if (filters.category.length > 0) {
        q = query(q, where("category", "array-contains-any", filters.category));
      }

      // Filter based on event status
      const statusFilters = [];
      if (filters.status.includes("Open")) {
        statusFilters.push(where("registrationDeadline", ">", today));
      }
      if (filters.status.includes("Closing Soon")) {
        const twoWeeksLater = Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
        statusFilters.push(where("registrationDeadline", "<=", twoWeeksLater), where("registrationDeadline", ">", today));
      }

      if (statusFilters.length) {
        statusFilters.forEach(statusCondition => {
          q = query(q, statusCondition);
        });
      }

      console.log("Final Query:", q); // Check the query

      // Fetch and return results
      const snapshot = await getDocs(q);
      const results= snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log("Query results:", results)
    },
    resetFilters() {
      this.filters = {
        where: { nearMe: false },
        priceRange: 0,
        status: [],
        date: {
          start: '',
          end: ''
        },
        category: [],
        otherChecked: false,
        otherCategory: ''
      };
    }
  },
  beforeUnmount() {
    document.body.style.overflow = 'auto';
  },
};
</script>

<style scoped>
.subheader {
  font-size: 1rem;
  color: #6c757d;
}

.filter-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  border:black;
  z-index: 1000;
  overflow-y: auto;
}

.filter-title {
  min-width: 100px;
}

.filter-content {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
}
.btn {
      padding: 10px 25px;
      border: 1px solid #085c44;
      border-radius: 50px;
      color: #085c44;
      /* display: block;
      margin: 0 auto; */
  }

.btn:hover {
    background-color: #085c44;
    color: white;
}

.filterComponent{
  display: inline-block;
  margin-right: 20px;
  width: 300px;
  margin-bottom: 20px;
}
.checkbox{
  display:block;
}
.status-buttons .status-button {
  padding: 5px 15px;
  border: 1px solid #085c44;
  color: #085c44;
  background-color: white;
  border-radius: 50px;
  margin-right: 5px;
  transition: background-color 0.3s, color 0.3s;
}

.status-buttons .status-button.active {
  background-color: #085c44;
  color: white;
}
</style>


<!-- <script>
import EventCard from "../components/eventCard.vue";

export default {
  components: {
    EventCard
  },
  data() {
    return {
      searchQuery: "",
      Events: [
        {
          id: 1,
          title: "Reboot Your System: Computer Repair for Beginners",
          registrationDeadline: "20 October 2024",
          eventDate: "1 November 2024",
          image: "https://placehold.co/100",
          isClosingSoon: true
        },
        {
          id: 2,
          title: "Fix It All: DIY Home Appliance Repair",
          registrationDate: "15 October 2024",
          eventDate: "25 October 2024",
          image: "https://placehold.co/100",
          isClosingSoon: true
        },
        {
          id: 3,
          title: "DIY Home Appliance Repair",
          registrationDate: "15 October 2024",
          eventDate: "25 October 2024",
          image: "https://placehold.co/100",
          isClosingSoon: true
        },
        {
          id: 4,
          title: "System: Computer Repair for Beginners",
          registrationDate: "20 October 2024",
          eventDate: "1 November 2024",
          image: "https://placehold.co/100",
          isClosingSoon: true
        },
        {
          id: 5,
          title: "All: DIY Home Appliance Repair",
          registrationDate: "15 October 2024",
          eventDate: "25 October 2024",
          image: "https://placehold.co/100",
          isClosingSoon: true
        },
        {
          id: 6,
          title: "Home Appliance Repair",
          registrationDate: "15 October 2024",
          eventDate: "25 October 2024",
          image: "https://placehold.co/100",
          isClosingSoon: true
        },
        {
          id: 5,
          title: "Tech Essentials: Basic Device Repair",
          registrationDate: "10 October 2024",
          eventDate: "30 October 2024",
          image: "https://placehold.co/100x80",
          isClosingSoon: false
        },
        {
          id: 6,
          title: "Advanced Electronics Workshop",
          registrationDate: "5 October 2024",
          eventDate: "22 October 2024",
          image: "https://placehold.co/100x80",
          isClosingSoon: false
        },
      ],
      colClass: "col-lg-4 col-md-6 col-12",
    };
  },
  computed: {
    chunkedClosingSoonEvents() {
            let chunkSize;
            if (window.innerWidth >= 992) {
                chunkSize = 3;
            } else if (window.innerWidth >= 768) {
                chunkSize = 2;
            } else {
                chunkSize = 1;
            }

            const chunks = [];
            for (let i = 0; i < this.closingSoonEvents.length; i += chunkSize) {
                chunks.push(this.closingSoonEvents.slice(i, i + chunkSize));
            }
            return chunks;
        }
  },
  mounted() {
    // Update chunks when resizing window
    window.addEventListener("resize", this.updateChunks);
  },
  beforeUnmount() {
        window.removeEventListener("resize", this.updateChunks);
  },
  methods: {
    updateChunks() {
      // Trigger the chunkedClosingSoonEvents to recompute
      this.chunkedClosingSoonEvents;
    }
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.updateChunks);
  }
};
</script> -->


