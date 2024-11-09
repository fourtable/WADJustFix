<template>
  <div v-if="loading" class="loading-indicator">Loading profile...</div>
    <div class="profile-container" v-else-if="userData">
    <div class="profile-info">
      <div class="profile-pic">
        <img v-if="userData.imageUrl" :src="imagePath" alt="Profile Picture" />
        <img v-else :src="imagePath" alt="Default Profile Picture" />
      </div>

      <!-- Profile Details for Repairers -->
      <div class="profile-details" v-if="userData.userType === 'repairer'">
        <h2 class="profile-name">{{ userData.name }}</h2>
        <!-- <p class="skill-level">Skill Level: {{ calculateSkillLevel(userData.experience) }}</p> -->
        <h4 v-if="userData.expertise && userData.expertise.length">Areas of Expertise:</h4>
        <div v-if="userData.expertise && userData.expertise.length">
          <span v-for="expertise in userData.expertise" :key="expertise" class="expertise-badge">
            {{ expertise }}
          </span>
        </div>
        <div v-else>
          <p>No areas of expertise provided.</p>
        </div>
        <div v-if="userData.description" >
          <h4>About Me:</h4>
          <p>{{ userData.description }}</p>
        </div>
        <p>Joined: {{ calculateJoinedDate(userData.createdAt) }}<span v-if="calculateJoinedDate(userData.createdAt) !== 'Today'"> ago</span></p>
      </div>

      <!-- Basic Profile Details for Non-Repairers -->
      <div class="profile-details" v-else>
        <h2 class="profile-name">{{ userData.name }}</h2>
        <p>User</p>
        <div v-if="userData.description" >
          <h4>About Me:</h4>
          <p>{{ userData.description }}</p>
        </div>
        <p>Joined: {{ calculateJoinedDate(userData.createdAt) }}<span v-if="calculateJoinedDate(userData.createdAt) !== 'Today'"> ago</span></p>
      </div>
    </div>

    <!-- Edit Profile Button for Profile Owner -->
    <div v-if="isOwnProfile" class="edit-profile-btn" >
      <router-link :to="{ name: 'editProfile' }" class="btn btn-primary">Edit Profile</router-link>
    </div>
    <div v-else class="edit-profile-btn"><router-link :to="{ name: 'chat', query: {repairerId: this.id, repairName: userData.name, repairerPic: userData.imageUrl} }" class="btn btn-success">Chat</router-link></div>

    <!-- Tabs -->
    <div v-if="userData.userType !== 'admin'">
      <div class="tabs" >
        <button class="tab-button" :class="{ active: activeTab === 'reviews' }"
          @click="switchTab('reviews')">Reviews</button>
        <button v-if="isOwnProfile" class="tab-button" :class="{ active: activeTab === 'upcoming-events' }"
          @click="switchTab('upcoming-events')">Upcoming Events</button>
        <button class="tab-button" :class="{ active: activeTab === 'past-events' }"
          @click="switchTab('past-events')">Past Events</button>
        <button v-if="isOwnProfile" class="tab-button" :class="{ active: activeTab === 'saved-events' }"
          @click="switchTab('saved-events')">Saved Events</button>
      </div>

      <div class="tab-content">
        <!-- Reviews Tab -->
        <div id="reviews" class="tab" v-show="activeTab === 'reviews'" >
          <h3>Ratings: {{ averageRating || 'N/A' }} / 5 ⭐</h3>
          <div v-if="userData.reviews && userData.reviews.length">
            <div v-for="review in userData.reviews" :key="review.id" class="review" >
              <div class="review-header">
                <strong>{{ review.customer }}</strong> - {{ review.date }}
              </div>
              <div class="review-rating">
                <span v-for="n in review.stars" :key="n" class="star">⭐</span>
              </div>
              <p class="review-text">{{ review.text }}</p>
              <hr class="review-divider" />
            </div>
          </div>
          <div v-else>
            <p>No reviews available.</p>
          </div>
        </div>


        <!-- Upcoming Events Tab -->
        <div id="upcoming-events" class="tab" v-if="isOwnProfile" v-show="activeTab === 'upcoming-events'">
          <div v-if="upcomingEvents.length > 0" v-for="event in upcomingEvents" :key="event.id" class="event"
            >
            <h4 class="event-title">{{ event.title }} - {{ formatTimestamp(event.eventDate) }}</h4>
            <p class="event-description">{{ event.description + "" + event.organiserID }}</p>
            <div v-if="event.organiserID === id" class="event-actions">
              <<button class="btn btn-primary" ><router-link :to="{ name: 'EventSignees', params: {eventId: event.id} }" class="btn btn-success">Manage</router-link></button>>
            </div>
          </div>
          <div v-else class="no-events">No Upcoming Events</div>
        </div>

        <!-- Past Events Tab -->
        <div id="past-events" class="tab" v-if="isOwnProfile" v-show="activeTab === 'past-events'" >
          <div v-if="pastEvents.length > 0" v-for="event in pastEvents" :key="event.id" class="event" >
            <h4 class="event-title">{{ event.title }} - {{ formatTimestamp(event.eventDate) }}</h4>
            <p class="event-description">{{ event.description }}</p>
          </div>
          <div v-else class="no-events">No Past Events</div>
        </div>


        <div id="saved-events" class="tab" v-if="isOwnProfile" v-show="activeTab === 'saved-events'" >
          <div v-if="savedEvents.length > 0" v-for="event in savedEvents" :key="event.id" class="event"
            >
            <h4 class="event-title">{{ event.title }} - {{ formatTimestamp(event.eventDate) }}</h4>
            <p class="event-description">{{ event.description }}</p>
            <div class="event-actions">
              <button class="btn btn-remove" @click="openConfirmRemoveModal(event.eventId)">Remove</button>
              <button class="btn btn-signup" @click="signUpForEvent(event )">Sign Up</button>
            </div>
          </div>
          <div v-else class="no-events">No Saved Events</div>
        </div>

        <!-- Confirmation Modal -->
        <!-- <div v-if="openPopup" class="modal-overlay active" tabindex="-1" role="dialog">
          <div class="modal">
            <p>Are you sure you want to remove this event?</p>
            <div class="modal-actions">
              <button class="btn btn-confirm" @click="removeEvent(confirmEventId)">Yes</button>
              <button class="btn btn-cancel" @click="closeConfirmModal">No</button>
            </div>
          </div>
        </div> -->

        <div v-if="openPopup" class="modal" tabindex="-1" role="dialog" style="display: block;">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirm Deletion</h5>
                        <button type="button" class="close" @click="closeConfirmModal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                      <p>Are you sure you want to remove this event?</p>
                    </div>
                    <div class="modal-actions">
                      <button class="btn btn-danger" @click="removeEvent(confirmEventId)">Yes</button>
                      <button class="btn btn-secondary" @click="closeConfirmModal">No</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db, auth } from "../main";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayRemove, increment } from "firebase/firestore";

export default {
  data() {
    return {
      loading: true, // Initialize as true
      userData: {
        imageUrl: '',
        userType: '',
        experience: '',
        expertise: [],
        description: '',
        rating: 4.2, // Example rating
        reviews: []
      },
      activeTab: 'reviews',
      upcomingEvents: [],
      pastEvents: [],
      savedEvents: [],
      openPopup: false, // Controls modal visibility
      confirmEventId: null, // Stores the ID of the event to be removed
    };
  },
  methods: {
    async fetchUserData(uid) {
      this.loading = true; // Start loading
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            const fetchedData = userDoc.data();
            this.userData = { ...fetchedData, reviews: [] };
            await this.fetchUserReviews(uid);
            await this.fetchSavedEvents(uid);
            await this.fetchSignedUpEvents(uid);
        } else {
            console.error("No user data found!");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    } finally {
        this.loading = false; // End loading
    }
},
    async fetchUserReviews(uid) {
      try {
        console.log("Fetched reviews:", this.userData.reviews);
        const reviewsQuery = query(collection(db, "reviews"), where("revieweeID", "==", uid));
        const querySnapshot = await getDocs(reviewsQuery);
        const reviews = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            customer: data.reviewerName,
            date: data.createdAt,
            stars: data.rating,
            text: data.comments
          };
        });
        this.userData.reviews = reviews;
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    },
    async fetchSignedUpEvents(uid) {
      try {
        console.log("Fetching saved events...");
        const userDocRef = doc(db, "users", uid); // Reference to the Firestore user document
        const docSnap = await getDoc(userDocRef); // Fetch the document

        if (docSnap.exists()) {
          // Check if events exist in the document
          const allEvents = docSnap.data().signedUpEvents || []; // Get all events or empty array if none exist
          const today = new Date();

          // Filter events where eventDate is after today
          this.upcomingEvents = allEvents.filter(event => event.eventDate.toDate() > today);
          this.pastEvents = allEvents.filter(event => event.eventDate.toDate() < today);
          console.log("Fetched upcoming events:", this.upcomingEvents);
        } else {
          console.log("No such document found for this user.");
        }
      } catch (error) {
        console.error("Error fetching saved events: ", error);
      }
    },
    async fetchSavedEvents(uid) {
      try {
        console.log("Fetched saved events....");
        const userDocRef = doc(db, "users", uid); // Reference to the Firestore user document
        const docSnap = await getDoc(userDocRef); // Fetch the document

        if (docSnap.exists()) {
          // Check if events exist in the document
          this.savedEvents = docSnap.data().savedEvents || []; // Assign events or empty array if none exist
          console.log("Fetched saved events:", this.savedEvents);
        } else {
          console.log("No such document found for this user.");
        }
      } catch (error) {
        console.error("Error fetching saved events: ", error);
      }
    },
    formatTimestamp(timestamp) {
      const date = new Date(timestamp.seconds * 1000); // Convert Firebase Timestamp to JavaScript Date object
      const month = date.getMonth() + 1; // Months are 0-indexed, so add 1
      const day = date.getDate();
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    },
    calculateSkillLevel(experience) {
      const years = parseInt(experience, 10);
      if (years < 1) return 'Beginner';
      if (years <= 3) return 'Intermediate';
      if (years <= 5) return 'Advanced';
      return 'Expert';
    },
    switchTab(tabName) {
      this.activeTab = tabName;
    },
    calculateJoinedDate(createdAt) {
      if (!createdAt) return 'Unknown';

      const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      const currentDate = new Date();
      const diffTime = currentDate - createdDate; // Difference in milliseconds
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      
      let years = Math.floor(diffDays / 365);
      let remainingDays = diffDays % 365;
      let months = Math.floor(remainingDays / 30);
      let days = remainingDays % 30;

      if (years > 0) return `${years}y ${months}m ${days}d`;
      if (months > 0) return `${months}m ${days}d`;
      return `${days}d`;
    },
    openConfirmRemoveModal(eventId) {
      this.confirmEventId = eventId;
      this.openPopup = true;
      // console.log("showConfirmModal:", this.openPopup); // Debug log 
    },
    // Close confirmation modal
    closeConfirmModal() {
      this.openPopup = false;
      this.confirmEventId = null;
    },
    // Remove the event if user confirms
    async removeEvent(eventId) {
      try {
        // Find the event to remove locally by filtering out the event with the specified eventId
        console.log(eventId);
        this.savedEvents = this.savedEvents.filter(event => event.eventId !== eventId);
        // Get the current user ID from the route params or fallback if needed
        const uid = this.$route.params.id;
        // Reference to the user's document in Firestore
        const userDocRef = doc(db, "users", uid);
        // Fetch the user's document to get the savedEvents array
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          console.error("User document not found.");
          return;
        }
        const userData = userDocSnap.data();
        // Find the event in the user's savedEvents array
        const eventToRemove = userData.savedEvents?.find(event => event.eventId === eventId);

        console.log(eventToRemove);
        if (!eventToRemove) {
          console.log("Event not found in user's saved events.");
          return;
        }
        // Remove the event from the user's savedEvents array in Firestore
        await updateDoc(userDocRef, {
          savedEvents: arrayRemove(eventToRemove)  // Remove the exact event object from savedEvents
        });
        const eventDocRef = doc(db, "events", eventId);
        await updateDoc(eventDocRef, {
          vacantSlots: increment(1)  // Increase the vacant slots since the user is unsubscribed
        });
        // console.log(`Event with ID: ${eventId} removed successfully from Firestore.`);
        this.showNotification("Event removed", "alert");
        // Close modal after removal
        this.closeConfirmModal();
      } catch (error) {
        console.log(error);
        this.showNotification("There was an error removing the event. Please try again.", "alert");
      }
    },

    // Sign up for an event (stubbed out for now)
    signUpForEvent(event) {
      // console.log(`Signed up for event with ID: ${eventId}`);
      // Additional logic for signing up for the event
      this.$router.push({ name: "eventSignup", params: { eventId: event.eventId } });
    },
    showNotification(message, type) {
      const notification = {
        type: type,
        message: message,
        timestamp: new Date().toISOString(),
        isVisible: true,
      };
      console.log('Dispatching notification:', notification);
      this.$store.dispatch('addNotification', notification); // Dispatch the action to add notification
    },
  },
  props: ['id'],

  mounted() {
    const userId = this.id || this.$route.params.id;
    if (userId) {
      this.fetchUserData(userId);
    } else {
      console.error('No user ID found in route params');
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            this.loggedInUserId = user.uid;
            const userId = this.id || this.$route.params.id;
            if (userId) {
                this.fetchUserData(userId); // Call fetch after user is authenticated
            } else {
                console.error('No user ID found in route params');
            }
        } else {
            console.error("User is not logged in");
            this.$router.push({ name: 'Home' }); // Redirect to Home if not authenticated
        }
    });
  },
  computed: {
    imagePath() {
      return this.userData.imageUrl || "../assets/person.svg";
    },
    isOwnProfile() {
      return auth.currentUser && auth.currentUser.uid === this.$route.params.id;
    },
    averageRating() {
      const totalStars = this.userData.reviews.reduce((sum, review) => sum + review.stars, 0);
      const reviewCount = this.userData.reviews.length;
      return reviewCount > 0 ? (totalStars / reviewCount).toFixed(1) : null;
    }
  }
};
</script>

<style scoped>
.profile-container {
  max-width: 900px;
  margin: 50px auto;
  padding: 30px;
  background-color: #ffffff;
  border: 1px solid #f7f7f7;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.profile-info {
  text-align: center;
  margin-bottom: 20px;
}

.profile-pic img {
  border-radius: 50%;
  width: 180px;
  height: 180px;
  object-fit: cover;
  margin-bottom: 15px;
}

.skill-level {
  font-size: 1.2rem;
  color: #085C44;
  margin-top: 10px;
}

.edit-profile-btn {
  display: flex;
  justify-content: center;
  /* Centers the button */
  margin-top: 20px;
  /* Adds spacing from the content above */
}

.tabs {
  display: flex;
  justify-content: space-around;
  width: 100%;
  margin-top: 30px;
}

.tab-button {
  flex: 1;
  text-align: center;
  padding: 15px 0;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: border-bottom 0.3s;
  font-weight: bold;
}

.tab-button.active {
  border-bottom: 3px solid #007bff;
}

.review {
  padding: 10px 0;
}

.review-header {
  font-weight: bold;
  margin-bottom: 5px;
}

.review-rating {
  color: #FFD700;
}

.review-divider {
  margin: 10px 0;
  border: none;
  border-bottom: 1px solid #e0e0e0;
}

.expertise-badge {
  display: inline-block;
  padding: 5px 15px;
  margin: 5px;
  border-radius: 30px;
  background-color: #B3C7FA;
  color: #085C44;
  font-weight: bold;
}

#saved-events, #upcoming-events, #past-events {
  margin: 20px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: 80%;
}

/* Title of the event */
.event-title {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
  display: inline-block;
  text-transform: capitalize;
}

/* Date and event description */
.event-description {
  font-size: 1em;
  color: #666;
  line-height: 1.5;
}

/* Style for individual event container */
.event {
  background-color: #fff;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.event:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* No events message styling */
.no-events {
  text-align: center;
  font-size: 1.1em;
  color: #999;
  padding: 20px;
}

.event-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  justify-content: end;
}

.btn {
  padding: 8px 16px;
  font-size: 0.9em;
  border-radius: 4px;
  cursor: pointer;
  border: none;
  transition: background-color 0.3s;
}

/* Remove button style */
.btn-remove {
  background-color: #ff4e50;
  color: #fff;
}

.btn-remove:hover {
  background-color: #e04c49;
}

/* Sign Up button style */
.btn-signup {
  background-color: #4CAF50;
  color: #fff;
}

.btn-signup:hover {
  background-color: #45a049;
}
.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: end;
  gap: 10px;
}
</style>
