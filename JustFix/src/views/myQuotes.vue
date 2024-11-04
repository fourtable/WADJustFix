<template>
  <div class="container my-5">
    <div class="d-flex justify-content-between align-items-center">
      <h2>My Quotes</h2>
      <div v-if="userType === 'user'">
        <createQuotesPopup :show="showQuotesPopup" :btnName="'+'" @close="showQuotesPopup = false" />
      </div>
    </div>
    <!-- List Group to display each quote -->
    <div class="mt-4">
      <div class="table-row header-row">
        <div class="table-cell">Item</div>
        <div class="table-cell">Category</div>
        <div class="table-cell">Repairer</div>
        <div class="table-cell">Created</div>
        <div class="table-cell">Actions</div>
      </div>
      <div v-if="quotes && quotes.length > 0" v-for="quote in quotes" :key="quote.id" class="table-row">
        <div class="table-cell">
          <div @click="showQuoteDetails(quote)" style="cursor: pointer; display: flex; align-items: center;">
            <img :src="quote.picture" alt="Quote Image" class="quote-image img-thumbnail" />
            <strong>{{ capitalizeWords(quote.item) }}</strong>
          </div>
        </div>
        <div class="table-cell">{{ quote.category }}</div>
        <div class="table-cell" v-if="quote.repairerName">{{ quote.repairerName }}</div>
        <div class="table-cell" v-else>No Repairer</div>
        <div class="table-cell">{{ formatTimestamp(quote.timestamp) }}</div>
        <div class="table-cell">
          <div class="button-container" v-if="quote.status == 'Completed'">
            <button class="btn btn-primary btn-sm table-button" @click="reviewQuote(quote)">Review</button>
          </div>
          <div class="button-container" v-if="quote.userId == uid && quote.status!= 'Completed'">
            <button class="btn btn-warning btn-sm table-button" @click="editQuote(quote)" :disabled="quote.repairerName">Edit</button>
            <button class="btn btn-danger btn-sm table-button" @click="deleteQuote(quote.id)" :disabled="quote.repairerName">Delete</button>
          </div>
          <div class="button-container" v-if="quote.repairerId == uid && quote.status == 'In Progress' ">
            <button class="btn btn-success btn-sm table-button" @click="CompleteQuote(quote)">Completed</button>
            <button class="btn btn-danger btn-sm table-button" @click="RejectQuote(quote.id)">Reject</button>
          </div>
        </div>
      </div>
      <!-- Display message if no quotes are available -->
      <div v-else class="text-center">
        No quotes available
      </div>
    </div>

    <!-- Quote Details Modal -->
    <div class="modal fade" :class="{ show: showModal }" :style="{ display: showModal ? 'block' : 'none' }"
      tabindex="-1" aria-labelledby="quoteDetailsLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="quoteDetailsLabel">{{ selectedQuote.category }}</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedQuote.picture">
              <p><strong>Picture:</strong></p>
              <img :src="selectedQuote.picture" alt="Quote Image" class="img-fluid quote-image" />
            </div>
            <p><strong>Description:</strong></p>
            <div class="description-box">
              <p>{{ selectedQuote.description }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <!-- <button type="button" class="btn btn-secondary" @click="closeModal">Close</button> -->
          </div>
        </div>
      </div>
    </div>

    <!-- Modal backdrop -->
    <div v-if="showModal" class="modal-backdrop fade show" @click="closeModal"></div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { db } from '../main';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import createQuotesPopup from '../components/createQuotesPopup.vue';
import Cookies from 'js-cookie';
import { useRoute } from 'vue-router';

const route = useRoute();

export default {
  components: {
    createQuotesPopup,
  },
  data() {
    return {
      showModal: false,
      selectedQuote: {},
      showQuotesPopup: false,
      isDisabled: false,
    };
  },
  computed: {
    // Access Vuex store
    quotes() {
      const userQuotes = this.$store.getters.getUserQuotes; // Access quotes from Vuex store
      console.log("Retrieved quotes from Vuex store:", userQuotes); // Log quotes for debugging
      return userQuotes;
    },
    uid() {
      return Cookies.get('uid') || sessionStorage.getItem('uid');
    },
    userType() {
      return Cookies.get('userType') || sessionStorage.getItem('userType');
    },
  },
  mounted() {
    // Open popup if query parameter `openPopup` is true
    this.showQuotesPopup = this.$route.query.openPopup === 'true';
    this.updatePopupState();
  },
  watch: {
    '$route.query.openPopup'(newVal) {
      console.log("Route query changed, openPopup:", newVal); // Debugging log
      this.showQuotesPopup = newVal === 'true';
    }
  },
  async created() {
    this.fetchUserQuotes(); // Fetch quotes from Firestore
  },
  // async created() {
  //   await this.$store.dispatch('fetchUserQuotes'); // Fetch user quotes from Vuex store
  // },
  methods: {
    fetchUserQuotes() {
      let userQuotesQuery = '';
      if (this.uid) {
        const quotesCollection = collection(db, 'quotes');

        if (this.userType == "user") {
          userQuotesQuery = query(quotesCollection, where('userId', '==', this.uid));
        }
        else if (this.userType == "repairer") {
          userQuotesQuery = query(quotesCollection, where('repairerId', '==', this.uid));
        }
        else {
          userQuotesQuery = quotesCollection;
        }

        // Listen to changes in the collection and retrieve quotes for the user
        onSnapshot(userQuotesQuery, (snapshot) => {
          const retrievedQuotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          this.$store.commit('setQuotes', retrievedQuotes); // Update quotes in Vuex store
        });
      } else {
        console.log("User is not logged in");
      }
    },
    showQuoteDetails(quote) {
      this.selectedQuote = quote;
      this.showModal = true;
    },
    closeModal() {
      this.showModal = false;
      this.selectedQuote = {};
    },
    capitalizeWords(item) {
      return item
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    updatePopupState() {
      console.log("Initial or route update, openPopup:", this.$route.query.openPopup);
      this.showQuotesPopup = this.$route.query.openPopup === 'true';
    },
    formatTimestamp(timestamp){
      return timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : '';
    }, 
  },
  beforeRouteUpdate(to, from, next) {
    // Check for query changes before route update and apply the changes
    if (to.query.openPopup !== from.query.openPopup) {
      this.showQuotesPopup = to.query.openPopup === 'true';
    }
    next();
  }
};

</script>

<style>
.container {
  padding-top: 3%;
}

img {
  margin-bottom: 10px;
}

.quote-image {
  width: 100%;
  /* Make the image responsive */
  max-width: 40vw;
  /* Limit the maximum width to 20vw */
  max-height: 40vh;
  /* Limit the maximum height to 20vh */
  height: auto;
  /* Maintain aspect ratio */
  aspect-ratio: 1 / 1;
  /* Ensure a 1:1 aspect ratio */
  object-fit: cover;
  /* Cover the area of the container */
  display: block;
  /* Ensures there's no extra space below the image */
  border-radius: 20px;
}

.description-box {
  border: 1px solid #ccc;
  /* Light gray border */
  border-radius: 20px;
  /* Rounded corners */
  padding: 10px;
  /* Padding inside the box */
  background-color: #f9f9f9;
  /* Light background color */
  margin-top: 10px;
  /* Space above the box */
}

.list-group {
  li {
    padding: 3% 0 3% 3%;
  }
}

/* Flexbox for the entire table body */
.table-row {
  display: flex;
  align-items: center;
  /* Center vertically */
  text-align: center;
  padding: 10px;
  transition: background-color 0.3s ease;
  /* Smooth transition */
  border: 2px solid #cdf696;
  /* Bottom border for each row */

  /* Image styling */
  .quote-image {
    width: 50px;
    height: 50px;
    margin-right: 10px;
    /* Space between image and text */
  }

  /* Animation on image hover */
  .quote-image:hover {
    transform: scale(1.1);
    /* Scale image on hover */
    transition: transform 0.3s ease;
  }
}

/* Change background color on hover */
.table-row:hover {
  background-color: #cdf696;
  /* Light gray background on hover */
}

/* Flexbox for horizontal alignment */
.table-cell {
  flex: 1;
  /* Equal space for each cell */
  display: flex;
  align-items: center;
  /* Center vertically */
  justify-content: flex-start;
  /* Align to the left */
  padding: 5px;
  /* Add some padding for aesthetics */
  border-right: 1px solid #dee2e6;
  /* Right border for each cell */
}

/* Remove the last cell's right border */
.table-cell:last-child {
  border-right: none;
  /* No border on the last cell */
}

/* Header styling */
.header-row {
  font-weight: bold;
  /* background-color: #085C44; */
  /* Bootstrap primary color */
  color: black;
  /* Text color */
  border: 2px solid #cdf696;
  /* border-bottom: 2px solid #cdf696; */
  /* Bottom border for header */
}

/* Flexbox for button container */
.button-container {
  display: flex;
  justify-content: space-around;
  /* Space buttons evenly */
  width: 100%;
}

/* Container styling */
.table-container {
  border: 1px solid #dee2e6;
  /* Outer border for the entire table */
  border-radius: 5px;
  /* Optional: rounded corners */
  overflow: hidden;
  /* Ensures inner rows don't overflow */
}

.table-button {
  width: 10vh;
  /* Set a fixed width for both buttons */
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Media queries for mobile responsiveness */
@media (max-width: 768px) {

  /* Stack table cells vertically on small screens */
  .table-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .table-cell {
    flex-direction: row;
    width: 100%;
    border-right: none;
    padding: 5px 0;
  }

  /* Resize image for smaller screens */
  .quote-image {
    width: 40px;
    height: 40px;
  }

  /* Adjust button width and font size for smaller screens */
  .table-button {
    width: 100%;
    /* Full width for easier clicking on mobile */
    font-size: 14px;
  }

  /* Reduce padding for smaller screen */
  .table-row {
    padding: 8px;
  }
}
</style>
