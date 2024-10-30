<template>
    <div class="my-quotes">
        <h1>My Quotes</h1>
        <div>
            <button @click="showCreateQuoteModal = true" class="btn btn-primary">Create New Quote</button>
            <div class="quote-list">
                <h2>Your Quotes</h2>
                <ul>
                    <li v-for="quote in userQuotes" :key="quote.id">
                        <input type="checkbox" :value="quote" v-model="selectedQuotes" />
                        {{ quote.quoteDesc }} <!-- Updated to match the field name -->
                        <button @click="deleteQuote(quote.id)">Delete</button>
                    </li>
                </ul>
            </div>
            <button @click="sendQuotes" class="btn btn-success">Send Selected Quotes</button>

            <!-- Create Quote Modal -->
            <div v-if="showCreateQuoteModal" class="modal">
                <div class="modal-content">
                    <span @click="showCreateQuoteModal = false" class="close">&times;</span>
                    <h2>Create New Quote</h2>
                    <textarea v-model="newQuoteText" placeholder="Enter your quote here..."></textarea>
                    <input type="number" v-model="newQuotePrice" placeholder="Enter price..." />
                    <input type="text" v-model="newQuoteImg" placeholder="Enter image URL..." />
                    <button @click="createQuote">Create Quote</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex'; // Import useStore from Vuex
import { db } from '../plugins/firebaseManager';
import { addDoc, deleteDoc, doc } from 'firebase/firestore';

// State variables
const store = useStore(); // Initialize the Vuex store
const selectedQuotes = ref([]); // Array for selected quotes
const newQuoteText = ref(''); // Text for new quote
const newQuotePrice = ref(null); // Price for new quote
const newQuoteImg = ref(''); // Image URL for new quote
const showCreateQuoteModal = ref(false); // Toggle for modal display

// Use computed to get user quotes from Vuex
const userQuotes = computed(() => store.getters.getUserQuotes);

// Fetch quotes when the component is mounted
const getUserQuotes = async () => {
    const userId = 'your-user-id-here'; // Replace with actual user ID from auth
    await store.dispatch('fetchUserQuotes', userId);
};

// Create a new quote
const createQuote = async () => {
    if (!newQuoteText.value.trim()) return;

    await addDoc(collection(db, 'quotes'), {
        quoteDesc: newQuoteText.value,
        price: newQuotePrice.value,
        quoteImg: newQuoteImg.value,
        createdAt: new Date(), // Firestore timestamp
        uid: 'your-user-id-here', // Replace with actual user ID
    });

    // Reset form fields
    newQuoteText.value = '';
    newQuotePrice.value = null;
    newQuoteImg.value = '';
    showCreateQuoteModal.value = false;
    await getUserQuotes(); // Refresh user quotes
};

// Delete a quote
const deleteQuote = async (quoteId) => {
    await deleteDoc(doc(db, 'quotes', quoteId));
    await getUserQuotes(); // Refresh user quotes
};

// Send selected quotes
const sendQuotes = () => {
    console.log("Sending quotes:", selectedQuotes.value);
};

// Fetch user quotes on component mount
onMounted(getUserQuotes);
</script>
