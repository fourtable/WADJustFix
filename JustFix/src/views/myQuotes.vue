<template>

  <div class="container my-5">
    <div class="d-flex justify-content-between align-items-center">
      <h2 v-if="userType !== 'admin'" class="mt-3">My Quotes</h2>
      <h2 v-else>Quotes List</h2>
      <div v-if="userType === 'user'">
        <QuotesPopup class="mt-5" :show="showQuotesPopup" :btnName="'Add a Quote'" :action="'Create'"
          @close="showQuotesPopup = false" />
      </div>
    </div>

    <div class="table-container">
      <table class="custom-table">
        <!-- List Group to display each quote -->
        <div class="mt-4" style="overflow-x:auto;">
          <div class="table-row header-row text-center">
            <div class="table-cell">Item</div>
            <div class="table-cell text-center">Category</div>
            <div v-if="userType == 'user'" class="table-cell text-center">Fixer</div>
            <div v-else class="table-cell text-center">Customer</div>
            <div class="table-cell text-center">Created</div>
            <div class="table-cell text-center">Status</div>
            <div v-if="userType !== 'admin'" class="table-cell text-center">Actions</div>
          </div>

          <div v-if="uncompleteQuotes && uncompleteQuotes.length > 0" v-for="quote in uncompleteQuotes" :key="quote.id"
            class="table-row">
            <!-- Item Column -->
            <div class="table-cell text-center">
              <div @click="showQuoteDetails(quote)"
                style="cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <img :src="quote.picture" alt="Quote Image" class="quote-image img-thumbnail" />
                <strong>{{ capitalizeWords(quote.item) }}</strong>
              </div>
            </div>

            <!-- Category Column, centered -->
            <div class="table-cell text-center">{{ quote.category || '-' }}</div>

            <!-- Fixer/Customer Column -->
            <div v-if="userType == 'user'" class="table-cell text-center">{{ quote.repairerName || 'No Fixer' }}
            </div>
            <div v-else class="table-cell text-center">{{ quote.userName }}</div>

            <!-- Created Date Column, centered -->
            <div class="table-cell text-center">{{ formatTimestamp(quote.timestamp) }}</div>

            <!-- Status Column -->
            <div class="table-cell text-center">{{ quote.status || '-' }}</div>

            <!-- Actions Column -->
            <div v-if="userType !== 'admin'" class="table-cell text-center">
              <div class="button-container d-flex flex-column">
                <ReviewPopup v-if="quote.status === 'Completed'" :quote="quote" ref="reviewPopup">Review</ReviewPopup>
                <QuotesPopup v-if="quote.userId === uid && quote.status !== 'Completed'"
                  :disableStatus="quote.status == 'In Progress'" :show="showEditQuotesPopup" :btnName="'Edit'"
                  :action="'Edit'" :editQuote="quote" @close="showQuotesPopup = false" />
                <ConfirmationPopup v-if="quote.userId === uid && quote.status !== 'Completed'" :quote="quote"
                  :disableStatus="quote.status == 'In Progress'"></ConfirmationPopup>
                <button v-if="quote.repairerId === uid && quote.status === 'In Progress'"
                  class="btn btn-success btn-sm table-button px-3 px-md-4 mb-2" @click="completeQuote(quote)">
                  Complete
                </button>
                <RejectPopup v-if="quote.repairerId === uid && quote.status === 'In Progress'" :quote="quote" />
              </div>
            </div>
          </div>

          <!-- Display message if no quotes are available -->
          <div v-else class="text-center mt-3 mb-3">No quotes available</div>
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
      </table>
    </div>
    <!-- Modal backdrop -->
    <div v-if="showModal" class="modal-backdrop fade show" @click="closeModal"></div>
  </div>

  <!-- Completed Quotes Section -->
  <div class="container my-5">
    <div class="d-flex justify-content-between align-items-center">
      <h2>Completed Quotes</h2>
    </div>
    <div class="table-container">
      <table class="custom-table">

        <div class="mt-4">
          <div class="table-row header-row text-center">

            <div class="table-cell">Item</div>
            <div class="table-cell text-center">Category</div>
            <div v-if="userType == 'user'" class="table-cell text-center">Fixer</div>
            <div v-else class="table-cell text-center">Customer</div>
            <div class="table-cell text-center">Created</div>
            <div class="table-cell text-center">Status</div>
            <div v-if="userType !== 'admin'" class="table-cell text-center">Actions</div>
          </div>

          <div v-if="completedQuotes && completedQuotes.length > 0" v-for="quote in completedQuotes" :key="quote.id"
            class="table-row">
            <!-- Item Column -->
            <div class="table-cell text-center">
              <div @click="showQuoteDetails(quote)"
                style="cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <img :src="quote.picture" alt="Quote Image" class="quote-image img-thumbnail" />
                <strong>{{ capitalizeWords(quote.item) }}</strong>
              </div>
            </div>

            <!-- Category Column, centered -->
            <div class="table-cell text-center">{{ quote.category || '-' }}</div>

            <!-- Fixer/Customer Column -->
            <div v-if="userType == 'user'" class="table-cell text-center">{{ quote.repairerName || 'No Repairer' }}
            </div>
            <div v-else class="table-cell text-center">{{ quote.userName }}</div>

            <!-- Created Date Column, centered -->
            <div class="table-cell text-center">{{ formatTimestamp(quote.timestamp) }}</div>

            <!-- Status Column -->
            <div class="table-cell text-center">{{ quote.status || '-' }}</div>

            <!-- Actions Column -->
            <div v-if="userType !== 'admin'" class="table-cell text-center">
              <div class="button-container d-flex flex-column align-items-center justify-content-center">

                <ReviewPopup v-if="quote.status === 'Completed'" :quote="quote"
                  :isReviewed="userType === 'repairer' && quote.fixerReview || userType === 'user' && quote.customerReview"
                  ref="reviewPopup">
                  Review
                </ReviewPopup>
                <!-- Edit -->
                <QuotesPopup v-if="quote.userId === uid && quote.status !== 'Completed'"
                  :disableStatus="quote.status == 'In Progress'" :show="showEditQuotesPopup" :btnName="'Edit'"
                  :action="'Edit'" :editQuote="quote" @close="showQuotesPopup = false" />
                <!-- delete -->
                <ConfirmationPopup v-if="quote.userId === uid && quote.status !== 'Completed'" :quote="quote"
                  :disableStatus="quote.status == 'In Progress'"></ConfirmationPopup>
                <button v-if="quote.repairerId === uid && quote.status === 'In Progress'"
                  class="btn btn-success btn-sm table-button px-3 px-md-4 mb-2" @click="completeQuote(quote)">
                  Complete
                </button>
                <RejectPopup v-if="quote.repairerId === uid && quote.status === 'In Progress'" :quote="quote" />
              </div>
            </div>
          </div>

          <!-- Display message if no quotes are available -->
          <div v-else class="text-center mt-3 mb-3">No quotes completed</div>
        </div>
      </table>
    </div>

  </div>
</template>




<script>
import { ref, onMounted, computed, watch } from 'vue';
import { db, realtimeDb, auth } from '../main';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, where, getDocs, getDoc, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref as dbRef, push } from 'firebase/database';
import QuotesPopup from '../components/QuotesPopup.vue';
import Cookies from 'js-cookie';
import ReviewPopup from '../components/ReviewPopup.vue';
import RejectPopup from '../components/RejectPopup.vue';
import ConfirmationPopup from '../components/ConfirmationPopup.vue';

export default {
  components: {
    QuotesPopup,
    ReviewPopup,
    RejectPopup,
    ConfirmationPopup,
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

    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        this.$router.push('/login');
      }
    });
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

        // Update points earned by repairer
        await addDoc(pointCollection, {
          Date: serverTimestamp(),
          UID: this.uid,
          points: 10,
          type: "earn",
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
  padding: 10px;
  transition: background-color 0.3s ease;
  border-left: 2px solid #085C44;
  /* Left border */
  border-right: 2px solid #085C44;
  /* Right border */
  border-bottom: 2px solid #085C44;
  /* Bottom border */

  /* Optional: Remove the top border */
  border-top: none;

  /* Image styling */
  .quote-image {
    width: 50px;
    height: 50px;
    margin-right: 10px;
  }
}


/* Flexbox for horizontal alignment */
.table-cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  /* border-right: 1px solid #dee2e6; */
  max-height: 10vh;
  min-height: 7vh;
  min-width: 5vw;


}

/* Remove the last cell's right border */
.table-cell:last-child {
  border-right: none;
  /* No border on the last cell */
}

/* Header styling */
.header-row {
  height: 40px;
  font-weight: bold;
  background-color: #085C44;

  color: white;
  justify-content: flex-start;
}

/* Flexbox for button container */
.button-container {
  display: flex;
  gap: 0px;
  padding: 0px;
  flex-wrap: nowrap;
}

.table-button {
  height: 25px;
  flex: 1 1 auto;
  min-width: 80px;
  padding: 0.5vw 1vw;
  font-size: calc(0.8rem + 0.2vw);
  width: 10vh;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.table-container {
  overflow-x: auto;
  width: calc(100% + 30px);
  /* Makes container slightly wider for more space */
  margin-bottom: 20px;
  margin: 0 -15px;
  /* Centers the extra width for a balanced appearance */

}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  /* Sets a minimum width so table doesn't shrink */
}

.custom-table th,
.custom-table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.custom-table th {
  background-color: #f4f4f4;
}

.custom-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.modal-body {
  color: black;
}

.table-cell {
  display: flex;
  justify-content: center;

  align-items: center;

  width: 100%;
  overflow: hidden;

}

.button-container {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  /* Allows wrapping of buttons */
  gap: 10px;
  width: auto;
  /* Ensure container doesn't exceed the available width */
  justify-content: center;
  /* Ensures buttons are centered within the container */
  align-items: center;
  /* Aligns the buttons at the center */
}

.btn {
  padding-left: 20px;
  padding-right: 20px;
  margin-bottom: 6px;
}
</style>
