<template>
  <div class="profile-container" v-if="userData">
    <div class="profile-info">
      <div class="profile-pic">
        <!-- Profile Picture with Fallback -->
        <img v-if="userData.imageUrl" :src="imagePath" alt="Profile Picture" />
        <img v-else :src="imagePath" alt="Default Profile Picture" />
      </div>

      <!-- For Repairers: Show Full Details -->
      <div class="profile-details" v-if="userData.userType === 'repairer'">
        <h2 class="profile-name">{{ userData.name }}</h2>
        <p class="skill-level">Skill Level: {{ calculateSkillLevel(userData.experience) }}</p>

        <!-- Expertise Section -->
        <h4 class="profile-description" v-if="userData.expertise && userData.expertise.length">Areas of Expertise:</h4>
        <div v-if="userData.expertise && userData.expertise.length">
          <span v-for="expertise in userData.expertise" :key="expertise" class="expertise-badge">
            {{ expertise }}
          </span>
        </div>

        <div v-else>
          <p class="profile-description">No areas of expertise provided.</p>
        </div>

        <!-- Joined Date Section (Always shown) -->
        <p>Joined: {{ calculateJoinedDate(userData.createdAt) }} ago</p>

        <!-- Description Section -->
        <div v-if="userData.description">
          <h4 class="profile-description">About Me:</h4>
          <p>{{ userData.description }}</p>
        </div>
      </div>

      <!-- For Non-Repairers: Show Only Name -->
      <div class="profile-details" v-else>
        <h2 class="profile-name">{{ userData.name }}</h2>
        <p class="profile-description">User</p>

        <!-- Joined Date Section -->
        <p>Joined: {{ calculateJoinedDate(userData.createdAt) }} ago</p>

        <!-- Show Description if Available -->
        <div v-if="userData.description">
          <h4 class="profile-description">About Me:</h4>
          <p>{{ userData.description }}</p>
        </div>
      </div>
    </div>

    <!-- Edit Profile Button (Only visible if user is viewing their own profile) -->
    <div v-if="isOwnProfile" class="edit-profile-btn">
      <router-link :to="{ name: 'editProfile' }" class="btn btn-primary">Edit Profile</router-link>
    </div>

    <!-- Conditional Tabs Rendering -->
    <div class="tabs">
      <button class="tab-button" :class="{ active: activeTab === 'reviews' }" @click="switchTab('reviews')">Reviews</button>
      <button v-if="userData.userType === 'repairer'" class="tab-button" :class="{ active: activeTab === 'upcoming-events' }" @click="switchTab('upcoming-events')">
        Upcoming Events
      </button>
      <button v-if="userData.userType === 'repairer'" class="tab-button" :class="{ active: activeTab === 'past-events' }" @click="switchTab('past-events')">
        Past Events
      </button>
    </div>

    <div class="tab-content">
      <!-- Reviews Tab: Show for All Users -->
      <div id="reviews" class="tab" v-show="activeTab === 'reviews'">
        <h3>Ratings: ⭐ {{ userData.rating || 'N/A' }} / 5</h3>
        <div v-for="review in userData.reviews" :key="review.id" class="review">
          <p>{{ review.text }}</p>
          <p>- {{ review.customer }}</p>
        </div>
      </div>

      <!-- Upcoming Events Tab: Show only for Repairers -->
      <div id="upcoming-events" class="tab" v-if="userData.userType === 'repairer'" v-show="activeTab === 'upcoming-events'">
        <h3>Upcoming Repair Events</h3>
        <div v-for="event in upcomingEvents" :key="event.id" class="event">
          <h4>{{ event.title }}</h4>
          <p>{{ event.date }}</p>
          <p>{{ event.description }}</p>
        </div>
      </div>

      <!-- Past Events Tab: Show only for Repairers -->
      <div id="past-events" class="tab" v-if="userData.userType === 'repairer'" v-show="activeTab === 'past-events'">
        <h3>Past Repair Events</h3>
        <div v-for="event in pastEvents" :key="event.id" class="event">
          <h4>{{ event.title }}</h4>
          <p>{{ event.date }}</p>
          <p>{{ event.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db, auth } from "../main"; // Import Firebase setup
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default {
  data() {
    return {
      userData: {
        imageUrl: '',
        userType: '',
        experience: '',
        expertise: [],
        description: '',
        rating: null,
        reviews: []
      },
      activeTab: 'reviews', // Default active tab
      upcomingEvents: [], // Placeholder for upcoming events
      pastEvents: [], // Placeholder for past events
    };
  },
  methods: {
    async fetchUserData(uid) {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          this.userData = userDoc.data();
        } else {
          console.error("No user data found!");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
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
      const diffTime = Math.abs(currentDate - createdDate); // Difference in milliseconds
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days

      let years = Math.floor(diffDays / 365); // Convert days to years
      let remainingDays = diffDays % 365; // Remaining days after years
      let months = Math.floor(remainingDays / 30); // Approximate months
      let days = remainingDays % 30; // Remaining days after months

      if (years > 0) return `${years}y ${months}m ${days}d`;
      if (months > 0) return `${months}m ${days}d`;
      return `${days}d`;
    },
  },
  props: ['id'], // Accept 'id' as a prop from the route

  mounted() {
    const userId = this.id || this.$route.params.id; // Get the id passed via the route or prop
    if (userId) {
      this.fetchUserData(userId); // Fetch the user data
    } else {
      console.error('No user ID found in route params');
    }

    // Check authentication state, to conditionally show the 'Edit Profile' button
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.loggedInUserId = user.uid; // Store the logged-in user ID
      } else {
        console.error("User is not logged in");
      }
    });
  },
  computed: {
    imagePath() {
      return this.userData.imageUrl || "../assets/person.svg"; // Return user's profile image URL or fallback
    },
    isOwnProfile() {
      return auth.currentUser && auth.currentUser.uid === this.$route.params.id;
    }
  }
};
</script>
  
  <style scoped>
  .profile-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 900px;
    margin: 50px auto;
    padding: 30px;
    background-color: #ffffff;
    border: 1px solid #f7f7f7;
    border-radius: 15px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  
  .profile-info {
    display: flex;
    flex-direction: column;
    align-items: center;
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
  
  .profile-name {
    font-size: 2rem;
    font-weight: bold;
  }
  
  .profile-description {
    color: #666;
    font-size: 1rem;
    margin-top: 5px;
  }
  
  .expertise-badge {
    display: inline-block;
    padding: 5px 15px;
    margin: 5px;
    border-radius: 30px;
    background-color: #B3C7FA;
    color: #085C44;
    font-weight: bold;
    font-size: 0.9rem;
  }
  
  .skill-level {
    font-size: 1.2rem;
    font-weight: bold;
    color: #085C44;
    margin-top: 10px;
  }
  
  .tabs {
    display: flex;
    justify-content: space-between;
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
    color: #444;
  }
  
  .tab-button.active {
    border-bottom: 3px solid #007bff;
  }
  
  .tab-content {
    width: 100%;
    margin-top: 20px;
  }
  
  .tab {
    display: none;
  }
  
  .tab.active {
    display: block;
  }
  
  .event,
  .review {
    margin: 20px 0;
  }
  
  .event h4,
  .review h4 {
    font-weight: bold;
  }
  </style>
  