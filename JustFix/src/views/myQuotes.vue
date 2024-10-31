<template>
    <div class="container my-5">
      <h2>My Quotes</h2>
  
      <!-- List Group to display each quote -->
      <ul class="list-group mt-4">
        <li 
          v-for="quote in quotes" 
          :key="quote.id" 
          class="list-group-item list-group-item-action"
          @click="showQuoteDetails(quote)"
        >
          <strong>{{ quote.item }}</strong> - {{ quote.category }}
        </li>
      </ul>
  
      <!-- Quote Details Modal -->
      <div
        class="modal fade"
        :class="{ show: showModal }"
        :style="{ display: showModal ? 'block' : 'none' }"
        tabindex="-1"
        aria-labelledby="quoteDetailsLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="quoteDetailsLabel">{{ selectedQuote.item }}</h5>
              <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p><strong>Category:</strong> {{ selectedQuote.category }}</p>
              <p><strong>Description:</strong> {{ selectedQuote.description }}</p>
              <div v-if="selectedQuote.picture">
                <p><strong>Picture:</strong></p>
                <img :src="selectedQuote.picture" alt="Quote Image" class="img-fluid" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Modal backdrop -->
      <div
        v-if="showModal"
        class="modal-backdrop fade show"
        @click="closeModal"
      ></div>
    </div>
  </template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex'; // Import useStore from Vuex
import { db } from '../main'
import { addDoc, deleteDoc, doc, collection, onSnapshot } from 'firebase/firestore';
import createQuotesPopup from '../components/createQuotesPopup.vue';
import Cookies from 'js-cookie';

// State variables
const store = useStore(); // Initialize the Vuex store
const selectedQuotes = ref([]); // Array for selected quotes
const newQuoteText = ref(''); // Text for new quote
const newQuotePrice = ref(null); // Price for new quote
const newQuoteImg = ref(''); // Image URL for new quote
const showCreateQuoteModal = ref(false); // Toggle for modal display

// // Use computed to get user quotes from Vuex
// const userQuotes = computed(() => store.getters.getUserQuotes);

// // Fetch quotes when the component is mounted
// const getUserQuotes = async () => {
//     const userId = 'your-user-id-here'; // Replace with actual user ID from auth
//     await store.dispatch('fetchUserQuotes', userId);
// };

// Create a new quote
// const createQuote = async () => {
//     if (!newQuoteText.value.trim()) return;

//     await addDoc(collection(db, 'quotes'), {
//         quoteDesc: newQuoteText.value,
//         price: newQuotePrice.value,
//         quoteImg: newQuoteImg.value,
//         createdAt: new Date(), // Firestore timestamp
//         uid: 'your-user-id-here', // Replace with actual user ID
//     });

//     // Reset form fields
//     newQuoteText.value = '';
//     newQuotePrice.value = null;
//     newQuoteImg.value = '';
//     showCreateQuoteModal.value = false;
//     await getUserQuotes(); // Refresh user quotes
// };

export default {
  data() {
    return {
      quotes: [],
      showModal: false,
      selectedQuote: {},
    };
  },
  async created() {
    this.fetchUserQuotes();
  },
  methods: {
    fetchUserQuotes() {
      const uid  = Cookies.get('uid') || sessionStorage.getItem('uid');
      if (uid) {
        const quotesCollection = collection(db, 'quotes');
        // const userQuotesQuery = query(quotesCollection, where('userId', '==', user.uid));

        onSnapshot(quotesCollection, (snapshot) => {
          this.quotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
  },
};
</script>
<style>
.my-quotes {
    margin-top: 3%;
}

</style>
