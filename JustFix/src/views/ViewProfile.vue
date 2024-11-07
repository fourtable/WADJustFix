<template>
  <div class="profile-container" v-if="userData">
    <div class="profile-info">
      <div class="profile-pic">
        <img v-if="userData.imageUrl" :src="imagePath" alt="Profile Picture" />
        <img v-else :src="imagePath" alt="Default Profile Picture" />
      </div>

      <!-- Profile Details for Repairers -->
      <div class="profile-details" v-if="userData.userType === 'repairer'">
        <h2 class="profile-name">{{ userData.name }}</h2>
        <p class="skill-level">Skill Level: {{ calculateSkillLevel(userData.experience) }}</p>
        <h4 v-if="userData.expertise && userData.expertise.length">Areas of Expertise:</h4>
        <div v-if="userData.expertise && userData.expertise.length">
          <span v-for="expertise in userData.expertise" :key="expertise" class="expertise-badge" data-aos="flip-right"
            data-aos-duration="600">
            {{ expertise }}
          </span>
        </div>
        <div v-else>
          <p>No areas of expertise provided.</p>
        </div>
        <div v-if="userData.description" data-aos="fade-up" data-aos-duration="800">
          <h4>About Me:</h4>
          <p>{{ userData.description }}</p>
        </div>
        <p>Joined: {{ calculateJoinedDate(userData.createdAt) }} ago</p>
      </div>

      <!-- Basic Profile Details for Non-Repairers -->
      <div class="profile-details" v-else>
        <h2 class="profile-name">{{ userData.name }}</h2>
        <p>User</p>
        <div v-if="userData.description" data-aos="fade-up" data-aos-duration="800">
          <h4>About Me:</h4>
          <p>{{ userData.description }}</p>
        </div>
        <p>Joined: {{ calculateJoinedDate(userData.createdAt) }} ago</p>
      </div>
    </div>

    <!-- Edit Profile Button for Profile Owner -->
    <div v-if="isOwnProfile" class="edit-profile-btn" data-aos="fade-up" data-aos-duration="600">
      <router-link :to="{ name: 'editProfile' }" class="btn btn-primary">Edit Profile</router-link>
    </div>

    <!-- Tabs -->
    <div v-if="userData.userType !== 'admin'">
      <div class="tabs" data-aos="fade-up" data-aos-duration="700">
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
        <div id="reviews" class="tab" v-show="activeTab === 'reviews'" data-aos="fade-up" data-aos-duration="700">
          <h3>Ratings: {{ averageRating || 'N/A' }} / 5 ⭐</h3>
          <div v-if="userData.reviews && userData.reviews.length">
            <div v-for="review in userData.reviews" :key="review.id" class="review" data-aos="fade-up"
              data-aos-delay="200">
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
          <h3>Upcoming Events</h3>
          <div v-if="upcomingEvents.length > 0" v-for="event in upcomingEvents" :key="event.id" class="event"
            data-aos="fade-up" data-aos-delay="200">
            <h4 class="event-title">{{ event.title }} - {{ formatTimestamp(event.eventDate) }}</h4>
            <p class="event-description">{{ event.description }}</p>
          </div>
          <div v-else class="no-events">No Saved Events</div>
        </div>


        <!-- Past Events Tab -->
        <div id="past-events" class="tab" v-if="isOwnProfile" v-show="activeTab === 'past-events'" data-aos="fade-up"
          data-aos-duration="700">
          <h3>Past Events</h3>
          <div v-if="pastEvents.length > 0" v-for="event in pastEvents" :key="event.id" class="event" data-aos="fade-up"
            data-aos-delay="200">
            <h4 class="event-title">{{ event.title }} - {{ formatTimestamp(event.eventDate) }}</h4>
            <p class="event-description">{{ event.description }}</p>
          </div>
          <div v-else class="no-events">No Saved Events</div>
        </div>


        <div id="saved-events" class="tab" v-if="isOwnProfile" v-show="activeTab === 'saved-events'" data-aos="fade-up"
          data-aos-duration="700">
          <div v-if="savedEvents.length > 0" v-for="event in savedEvents" :key="event.id" class="event"
            data-aos="fade-up" data-aos-delay="200">
            <h4 class="event-title">{{ event.title }} - {{ formatTimestamp(event.eventDate) }}</h4>
            <p class="event-description">{{ event.description }}</p>
            <div class="event-actions">
              <button class="btn btn-remove" @click="openConfirmRemoveModal(event.id)">Remove</button>
              <button class="btn btn-signup" @click="signUpForEvent(event.id)">Sign Up</button>
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
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default {
  data() {
    return {
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
      try {
        // Fetch main user data
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const fetchedData = userDoc.data();
          this.userData = {
            ...fetchedData,
            reviews: [] // Initialize empty array for reviews
          };

          // Fetch reviews for the user
          await this.fetchUserReviews(uid);
          await this.fetchSavedEvents(uid);
        } else {
          console.error("No user data found!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
    async fetchUserReviews(uid) {
      try {
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
    async fetchSavedEvents(uid) {
      try {
        const userDocRef = doc(db, "users", uid); // Reference to the Firestore user document
        const docSnap = await getDoc(userDocRef); // Fetch the document

        if (docSnap.exists()) {
          // Check if events exist in the document
          this.savedEvents = docSnap.data().event || []; // Assign events or empty array if none exist
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
      const diffTime = Math.abs(currentDate - createdDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
      console.log("showConfirmModal:", this.openPopup); // Debug log 
    },
    // Close confirmation modal
    closeConfirmModal() {
      this.openPopup = false;
      this.confirmEventId = null;
    },
    // Remove the event if user confirms
    removeEvent(eventId) {
      // Find the event to remove
      this.savedEvents = this.savedEvents.filter(event => event.id !== eventId);
      // Optionally, call an API to delete the event from the database
      console.log(`Event with ID: ${eventId} removed.`);
      // Close modal after removal
      this.closeConfirmModal();
    },
    // Sign up for an event (stubbed out for now)
    signUpForEvent(eventId) {
      // console.log(`Signed up for event with ID: ${eventId}`);
      // Additional logic for signing up for the event
      this.$router.push({ name: "eventSignup", params: { eventId: eventId } });
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
      } else {
        console.error("User is not logged in");
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

#saved-events {
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
