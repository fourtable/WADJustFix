<template>
  <div class="container my-5">
    <div class="d-flex justify-content-between align-items-center">
      <h2>My Quotes</h2>
      <div v-if="userType === 'user'">
        <createQuotesPopup :show="showQuotesPopup" @close="showQuotesPopup = false"/>
      </div>
    </div>
    <!-- List Group to display each quote -->
    <ul class="list-group mt-4">
      <li v-if="quotes && quotes.length > 0" v-for="quote in quotes" :key="quote.id"
        class="list-group-item list-group-item-action" @click="showQuoteDetails(quote)">
        <strong>{{ capitalizeWords(quote.item) }}</strong> - {{ quote.category }}
      </li>
      <!-- Display message if no quotes are available -->
      <li v-else class="list-group-item text-center">
        No quotes available
      </li>
    </ul>

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
    }
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
          console.log("Quotes retrieved from Firestore:", retrievedQuotes); // Log retrieved quotes
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
</style>
