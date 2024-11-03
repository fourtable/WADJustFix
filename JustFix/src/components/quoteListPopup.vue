<template>
    <div class="modal fade show" :style="{ display: 'block' }" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Quotes List</h5>
                    <button type="button" class="btn-close" @click="closePopup" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <ul class="list-group">
                        <li v-if="quotes.length > 0" v-for="quote in quotes" :key="quote.id"
                            class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <input type="checkbox" :value="quote.id" v-model="selectedQuoteIds"
                                    class="custom-checkbox" />
                                <img :src="quote.picture" alt="Quote Image" class="quote-image" />
                                <div class="ms-2">
                                    <strong>{{ capitalizeWords(quote.item) }}</strong> - {{ quote.category }}
                                </div>
                            </div>
                        </li>
                        <li v-else class="list-group-item text-center">
                            No quotes available.
                            <br>
                            <createQuotesPopup :show="showQuotesPopup" :btnName="'Add Quotes'"
                                @close="showQuotesPopup = false" />
                        </li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" @click="sendQuotes">Send</button>
                </div>
            </div>
        </div>
    </div>
    <!-- Modal backdrop -->
    <div class="modal-backdrop fade show" @click="closePopup"></div>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../main'; // Ensure you import your Firebase db configuration
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { defineEmits } from 'vue';
import createQuotesPopup from './createQuotesPopup.vue';
import toast from './toast.vue';


const props = defineProps({
    selectedRepairmen: Array // Array of selected repairmen IDs or objects
});

const emit = defineEmits(['close']);

// Reactive variables
const quotes = ref([]);
const selectedQuoteIds = ref([]); // Store selected quote IDs

// Function to fetch quotes
const fetchQuotes = async () => {
    const quotesCollection = collection(db, 'quotes');
    const quoteSnapshot = await getDocs(quotesCollection);
    quotes.value = quoteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

function closePopup() {
    console.log("Closing popup...");
    emit('close');
};

function showNotification(message, type) {
    const notification = {
        type: type,
        message: message,
        timestamp: new Date().toISOString(),
        isVisible: true,
    };
    console.log('Dispatching notification:', notification);
    this.$store.dispatch('addNotification', notification); // Dispatch the action to add notification

}

// Function to send selected quotes to repairers
const sendQuotes = async () => {
    if (selectedQuoteIds.value.length === 0 || props.selectedRepairmen.length === 0) {
        alert('Please select at least one quote and one repairer.');
        return;
    }

    const selectedQuotes = quotes.value.filter(quote => selectedQuoteIds.value.includes(quote.id));

    // Send each selected quote to each selected repairman
    for (const repairman of props.selectedRepairmen) {
        for (const quote of selectedQuotes) {
            await sendQuoteToRepairer(quote, repairman.id); // Implement your logic here
        }
    }

    showNotification('Quotes sent successfully!', 'success');
    alert('Quotes sent successfully!');
    selectedQuoteIds.value = []; // Clear selections after sending
    closePopup(); // Close the popup
};

// Implement the actual logic to send a quote to a repairer
const sendQuoteToRepairer = async (quote, repairerId) => {
    try {
        const repairerQuotesRef = collection(db, 'repairerQuotes');
        await addDoc(repairerQuotesRef, {
            repairerId: repairerId,
            quoteId: quote.id,
            quoteData: quote, // You may want to store specific fields instead
            sentAt: new Date()
        });
        console.log(`Quote sent to repairer ${repairerId}`);
    } catch (error) {
        console.error("Error sending quote to repairer:", error);
    }
};

// Fetch user-specific quotes from Firestore
const fetchUserQuotes = () => {
    const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
    const userType = Cookies.get('userType') || sessionStorage.getItem('userType');
    let userQuotesQuery = '';

    if (uid) {
        const quotesCollection = collection(db, 'quotes');
        if (userType === 'user') {
            userQuotesQuery = query(quotesCollection, where('userId', '==', uid));
        } else if (userType === 'repairer') {
            userQuotesQuery = query(quotesCollection, where('repairerId', '==', uid));
        } else {
            userQuotesQuery = quotesCollection;
        }

        // Listen to changes in the collection and retrieve quotes for the user
        onSnapshot(userQuotesQuery, (snapshot) => {
            quotes.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        });
    } else {
        console.log("User is not logged in");
    }
};

onMounted(() => {
    fetchUserQuotes(); // Fetch user quotes when the component mounts
});

function capitalizeWords(item) {
    return item
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
</script>

<style lang="scss" scoped>
.modal-backdrop {
    z-index: 1040;
}

.modal {
    z-index: 1050;
}

.list-group {
    font-size: 20px;
}

/* Styling for the quotes list items */
.quote-item {
    display: flex;
    align-items: center;
}

/* Image styling for normal and smaller screens */
.quote-image {
    width: 5vw;
    height: 10vh;
    border-radius: 50%;
}

/* Checkbox customization */
.custom-checkbox {
    transform: scale(1.5);
    margin-right: 10px;
}

/* Adjust layout for smaller screens */
@media (max-width: 768px) {
    .list-group {
        font-size: 16px;
        /* Decrease font size */
    }

    .quote-image {
        width: 12vw;
        height: 8vh;
        border-radius: 50%;
    }

    .custom-checkbox {
        transform: scale(1.3);
        /* Reduce checkbox size slightly */
    }
}

@media (max-width: 576px) {
    .list-group {
        font-size: 14px;
    }

    .quote-image {
        width: 15vw;
        height: 6vh;
        border-radius: 50%;
    }

    .custom-checkbox {
        transform: scale(1.1);
    }
}
</style>
