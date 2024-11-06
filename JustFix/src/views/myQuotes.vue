<template>
  <div class="container my-5">
    <div class="d-flex justify-content-between align-items-center">
      <h2>My Quotes</h2>
      <div v-if="userType === 'user'">
        <QuotesPopup :show="showQuotesPopup" :btnName="'+'" :action="'Create'" @close="showQuotesPopup = false" />
      </div>
    </div>
    <!-- List Group to display each quote -->
    <div class="mt-4">
      <div class="table-row header-row text-center">
        <div class="table-cell">Item</div>
        <div class="table-cell">Category</div>
        <div v-if="userType == 'user'" class="table-cell">Fixer</div>
        <div v-else class="table-cell">Customer</div>
        <div class="table-cell">Created</div>
        <div class="table-cell">Status</div>
        <div class="table-cell">Actions</div>
      </div>
      <div v-if="uncompleteQuotes && uncompleteQuotes.length > 0" v-for="quote in uncompleteQuotes" :key="quote.id"
        class="table-row">
        <div class="table-cell">
          <div @click="showQuoteDetails(quote)" style="cursor: pointer; display: flex; align-items: center;">
            <img :src="quote.picture" alt="Quote Image" class="quote-image img-thumbnail" />
            <strong>{{ capitalizeWords(quote.item) }}</strong>
          </div>
        </div>
        <div class="table-cell">{{ quote.category }}</div>
        <div v-if="userType == 'user'" class="table-cell">{{ quote.repairerName || 'No Repairer' }}</div>
        <div v-else class="table-cell">{{ quote.userName }}</div>
        <div class="table-cell">{{ formatTimestamp(quote.timestamp) }}</div>
        <div class="table-cell">{{ quote.status || '-' }}</div>
        <div class="table-cell">
          <div class="button-container d-flex flex-column flex-xl-row">
            <ReviewPopup v-if="quote.status === 'Completed'" :quote="quote" ref="reviewPopup">Review</ReviewPopup>
            <QuotesPopup v-if="quote.userId === uid && quote.status !== 'Completed'" :disableStatus="quote.status == 'In Progress'" 
            :show="showQuotesPopup" :btnName="'Edit'" :action="'Edit'" :editQuote="quote" @close="showQuotesPopup = false" />
            <button v-if="quote.userId === uid && quote.status !== 'Completed'" :disabled="quote.status === 'In Progress'"
              class="btn btn-danger btn-sm table-button mb-2 mb-xl-0" @click="deleteQuote(quote.id)">
              Remove 
            </button>
            <button v-if="quote.repairerId === uid && quote.status === 'In Progress'"
              class="btn btn-success btn-sm table-button mb-2 mb-xl-0" @click="completeQuote(quote)">
              Complete
            </button>
            <!-- <button v-if="quote.repairerId === uid && quote.status === 'In Progress'"
              class="btn btn-danger btn-sm table-button mb-2 mb-xl-0" @click="rejectQuote(quote)">
              Reject
            </button> -->
            <RejectPopup v-if="quote.repairerId === uid && quote.status === 'In Progress'" :quote="quote" />
          </div>
        </div>
      </div>
      <!-- Display message if no quotes are available -->
      <div v-else class="text-center">No quotes available</div>
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
        </div>
      </div>
    </div>

    <!-- Modal backdrop -->
    <div v-if="showModal" class="modal-backdrop fade show" @click="closeModal"></div>
  </div>
  <div class="container my-5">
    <div class="d-flex justify-content-between align-items-center">
      <h2>Completed Quotes</h2>
    </div>
    <!-- List Group to display each quote -->
    <div class="mt-4">
      <div class="table-row header-row text-center">
        <div class="table-cell">Item</div>
        <div class="table-cell">Category</div>
        <div v-if="userType == 'user'" class="table-cell">Fixer</div>
        <div v-else class="table-cell">Customer</div>
        <div class="table-cell">Created</div>
        <div class="table-cell">Status</div>
        <div class="table-cell">Actions</div>
      </div>
      <div v-if="completedQuotes && completedQuotes.length > 0" v-for="quote in completedQuotes" :key="quote.id"
        class="table-row">
        <div class="table-cell">
          <div @click="showQuoteDetails(quote)" style="cursor: pointer; display: flex; align-items: center;">
            <img :src="quote.picture" alt="Quote Image" class="quote-image img-thumbnail" />
            <strong>{{ capitalizeWords(quote.item) }}</strong>
          </div>
        </div>
        <div class="table-cell">{{ quote.category }}</div>
        <div v-if="userType == 'user'" class="table-cell">{{ quote.repairerName || 'No Repairer' }}</div>
        <div v-else class="table-cell">{{ quote.userName }}</div>
        <div class="table-cell">{{ formatTimestamp(quote.timestamp) }}</div>
        <div class="table-cell">{{ quote.status || '-' }}</div>
        <div class="table-cell">
          <div class="button-container d-flex flex-column flex-xl-row">
            <ReviewPopup v-if="quote.status === 'Completed'" :quote="quote" ref="reviewPopup">Review</ReviewPopup>
          </div>
        </div>
      </div>
      <!-- Display message if no quotes are available -->
      <div v-else class="text-center">No quotes completed </div>
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
        </div>
      </div>
    </div>

    <!-- Modal backdrop -->
    <div v-if="showModal" class="modal-backdrop fade show" @click="closeModal"></div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { db, realtimeDb } from '../main';
import { collection, onSnapshot, query, where, getDocs, getDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as dbRef, push } from 'firebase/database';
import QuotesPopup from '../components/QuotesPopup.vue';
import Cookies from 'js-cookie';
import ReviewPopup from '../components/ReviewPopup.vue';
import RejectPopup from '../components/RejectPopup.vue';

export default {
  components: {
    QuotesPopup,
    ReviewPopup,
    RejectPopup,
  },
  data() {
    return {
      showModal: false,
      selectedQuote: {},
      showQuotesPopup: false,
      isDisabled: false,
      showEditQuotesPopup: false,
    };
  },
  computed: {
    quotes() {
      const userQuotes = this.$store.getters.getUserQuotes; // Access quotes from Vuex store
      console.log("Retrieved quotes from Vuex store:", userQuotes); // Log quotes for debugging
      return userQuotes;
    },
    uncompleteQuotes() {
      return this.quotes.filter(quote => quote.status !== 'Completed');
    },
    uid() {
      console.log(Cookies.get('uid') || sessionStorage.getItem('uid'));
      return Cookies.get('uid') || sessionStorage.getItem('uid');
    },
    userType() {
      return Cookies.get('userType') || sessionStorage.getItem('userType');
    },
    username() {
      return Cookies.get('username') || sessionStorage.getItem('username');
    },
    userPicture() {
      return Cookies.get('profilePic') || sessionStorage.getItem('profilePic');
    },
    completedQuotes() {
      return this.quotes.filter(quote => quote.status === 'Completed');
    }
  },
  mounted() {
    this.showQuotesPopup = this.$route.query.openPopup === 'true';
    this.fetchUserQuotes(); // Fetch quotes from Firestore
  },
  watch: {
    '$route.query.openPopup': {
      handler(newVal) {
        console.log("Route query changed, openPopup:", newVal); // Debugging log
        this.showQuotesPopup = newVal === 'true';
      },
      immediate: true // Ensures the watcher runs on component mount
    },
  },
  methods: {
    fetchUserQuotes() {
      if (!this.uid) {
        console.log("User is not logged in");
        return;
      }

      const quotesCollection = collection(db, 'quotes');
      const userQuotesQuery = this.userType === "user"
        ? query(quotesCollection, where('userId', '==', this.uid))
        : this.userType === "repairer"
          ? query(quotesCollection, where('repairerId', '==', this.uid))
          : quotesCollection;

      onSnapshot(userQuotesQuery, (snapshot) => {
        const retrievedQuotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        this.$store.commit('setQuotes', retrievedQuotes); // Update quotes in Vuex store
      }, (error) => {
        console.error("Error fetching user quotes: ", error);
      });
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
    formatTimestamp(timestamp) {
      return timestamp ? new Date(timestamp.seconds * 1000).toLocaleDateString() : '';
    },
    async completeQuote(quote) {
      try {
        // Reference to the specific quote document
        const quoteRef = doc(db, 'quotes', quote.id);
        const pointCollection = collection(db, 'points');
        await addDoc(pointCollection, {
          Date: serverTimestamp(),
          userId: this.uid,
          points: 10,
          });

        // Update the document
        await updateDoc(quoteRef, {
          status: 'Completed' // Update the status to 'Rejected'
        });
        this.notifyUser(quote.userId, "Quote completed!");
      } catch (error) {
        console.error('Error:', error);
      }
    },
    async notifyUser(receiverId, message) {
      const notificationRef = dbRef(realtimeDb, `notifications/${receiverId}`);
      await push(notificationRef, {
        notificationType: 'message',
        senderId: this.uid,
        senderName: this.username,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
      });
      await this.sendMessage(message, this.uid, receiverId)
      console.log('Notification sent to:', receiverId);
    },
    async sendMessage(message, senderId, receiverid) {
      if (message.trim()) {
        try {
          const [firstUserId, secondUserId] = [senderId, receiverid].sort();
          const arrayIds = [firstUserId, secondUserId];
          const chatDocRef = await addDoc(collection(db, 'chats'), {
            text: message,
            senderId: senderId,
            receiverId: receiverid,
            timestamp: serverTimestamp(),
            participants: arrayIds,
            photoURL: this.userPicture,
          });

          // Check if the contact is already in the user’s recent chats
          const contactsQuery = query(
            collection(db, 'contacts'),
            where('userIds', '==', arrayIds),
          );
          const querySnapshot = await getDocs(contactsQuery);

          if (querySnapshot.empty) {
            // If no existing contact, add new with userIds as an array
            await addDoc(collection(db, 'contacts'), {
              userIds: arrayIds,
              lastMessageTime: serverTimestamp(),
            });
          } else {
            // Update the lastMessageTime for the existing contact
            await updateDoc(querySnapshot.docs[0].ref, { lastMessageTime: serverTimestamp() });
          }
        } catch (error) {
          console.error("Error sending message:", error);
        }
      }
    },
  },
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
  justify-content: center;
  /* Center vertically */
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
.table-cell:hover {
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
  justify-content: center;
  /* Align to the left */
  padding: 5px;
  /* Add some padding for aesthetics */
  border-right: 1px solid #dee2e6;
  max-height: 10vh;
  min-height: 7vh;
  min-width: 5vw;
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
  background-color: #cdf696;
  /* Bootstrap primary color */
  color: black;
  /* Text color */
  border: 2px solid #cdf696;
  justify-content: flex-start;
  /* border-bottom: 2px solid #cdf696; */
  /* Bottom border for header */
}

@media (max-width: 768px) {
  .header-row {
    display: none;
  }
}

/* Flexbox for button container */
.button-container {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
}

.table-button {
  flex: 1 1 auto;
  min-width: 80px;
  padding: 0.5vw 1vw;
  /* Adjusts padding relative to viewport width */
  font-size: calc(0.8rem + 0.2vw);
  /* Responsive font size */
}

/* Maintain button shape on smaller screens */
@media (max-width: 768px) {
  .table-button {
    padding: 0.5rem 1rem;
  }
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

.modal-body{
    color:black;
}

</style>
