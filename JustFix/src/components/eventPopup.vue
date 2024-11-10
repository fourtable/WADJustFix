<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <button class="close-btn"  @click="closeModal">✕</button>
      <img :src="event.imageUrl" class="card-img-top mb-2 mt-4 rounded-1" alt="Event Image" v-if="event.imageUrl">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h3>{{ event.title }}</h3>
        <span class="badge" :class="badgeClass">{{ badgeText }}</span>
      </div>
      <p>{{ event.description }}</p>
      <p>Category: <span v-for="(category, index) in event.category" :key="index">{{ category }}<span
            v-if="index < event.category.length - 1">, </span></span></p>
      <p>Event Date: {{ formattedEventDate }}</p>
      <p>Time: {{ formattedEventTime }}</p>
      <p>Location: {{ event.locationName }}</p>
      <p>Address: {{ event.address }}</p>
      <p>Vacant Slots: {{ event.vacantSlots }}</p>
      <p>Registration Deadline: {{ formattedRegistrationDeadline }}</p>

      <!-- More event details as needed -->
      <div class="d-flex justify-content-between mt-3" v-if="userType !== 'admin'">
        <button class="btn" @click="handleSaveClick">Save Event</button>
        <button class="btn" @click="handleSignupClick" v-if="!isSignedUp">Sign Up!</button>
      </div>

    </div>
  </div>
</template>

<script>
import Cookies from 'js-cookie';
import { db } from '../main';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default {
  props: {
    event: {
      type: Object,
      required: true
    },
    user: {
      type: Object,
      required: true,
      default: null,
    },
    signedUpEventIds: {
      type: Array,
      default: () => []
    },
    canSignUp: {
      type: Boolean,
      default: true // Show button by default if not explicitly set
    },
    isModalVisible: true
  },
  setup(props, {emit}) {
    const router = useRouter();
    const auth = getAuth();
    const store = useStore();// Access the Vuex store

    // Define a reactive variable to store login status
    const isLoggedIn = ref(false);
    const userType = ref(null); // Add a reactive variable for userType

     // Check authentication state using both Firebase and stored credentials
    const checkAuthState = () => {
      const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
      const firebaseUser = auth.currentUser;
      isLoggedIn.value = !!(uid || firebaseUser);
      if (uid) fetchUserType(uid);
    };
    const fetchUserType = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        userType.value = docSnap.data().userType;
      } else {
        console.error("No user data found!");
      }
    } catch (error) {
      console.error("Error fetching user type:", error);
    }
  };
    // Listen to authentication state changes
    onAuthStateChanged(auth, () => {
      checkAuthState();
    });
    // Check auth state when component mounts
    onMounted(() => {
      checkAuthState();
    });
    const showNotification= async (message, type)=> {
      try {
        const notification = {
          type: type,
          message: message,
          timestamp: new Date().toISOString(),
          isVisible: true,
        };
        // console.log('Dispatching notification:', notification);
        store.dispatch('addNotification', notification); // Dispatch the action to add notification
      }
      catch (error) {
        console.error("Error showing notification:", error);
      }
    };
    // Define saveEvent function
    const saveEvent = async () => {
    const userDocRef = doc(db, "users", Cookies.get('uid') || sessionStorage.getItem('uid'));
    
    try {
      const docSnap = await getDoc(userDocRef);
      const newEvent = { 
        oraganiserId: props.event.organiserID,
        duration: props.event.duration,
        address: props.event.address || '',
        eventId: props.event.id,
        title: props.event.title,
        eventDate: props.event.eventDate,
        registrationDeadline: props.event.registrationDeadline,
        description: props.event.description,
        locationName: props.event.locationName || '',}; // Replace with actual event data

      if (docSnap.exists()) {
        const existingEvents = docSnap.data().savedEvents || [];
        const eventExists = existingEvents.some(event =>
          event.title === newEvent.title &&
          event.eventDate.seconds === newEvent.eventDate.seconds &&
          event.eventDate.nanoseconds === newEvent.eventDate.nanoseconds &&
          event.description === newEvent.description
        );
        console.log(eventExists);
        console.log(newEvent.eventId === props.event.id);
        console.log(newEvent);
        if (!eventExists) {
          await updateDoc(userDocRef, {
            savedEvents: arrayUnion(newEvent)
          });
          console.log("New event added to the array.");
          showNotification('Event added!', 'alert');
        } else {
          console.log("Event already exists, not adding duplicate.");
          showNotification('Event already added!', 'alert');
        }
      } else {
        await setDoc(userDocRef, {
          savedEvents: [newEvent]
        });
        console.log("User document created with the new event.");
        showNotification('Event added!', 'alert');
      }
    } catch (error) {
      console.error("Error saving event:", error);
    }
  };

    const handleSignupClick = async () => {
      const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
      if (!uid) {
          router.push('/login');
          return;
      } 
      try {
          // Check if user has reached the limit of 5 upcoming events
          if (!props.canSignUp) {
            showNotification('You have reached the limit of 5 upcoming events.','alert');
            return;
          };
        // Step 5: Proceed to EventSignup.vue if checks pass
        emit("openEventSignup", { event: props.event, user: props.user });
        
      } catch (error) {
        console.error("Error in signup logic:", error);
      }
    };

    // Handle Save Click with login check
    const handleSaveClick = async () => {
      const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
      if (!uid) {
        // Redirect to login page if not logged in
        sessionStorage.setItem('intendedPath', '/ViewProfile'); // Adjust path as needed
        router.push('/login');
      } else {
        // User is logged in, call saveEvent function
        try {
          await saveEvent();
          console.log("Event saved successfully");
        } catch (error) {
          console.error("Error saving event:", error);
        }
      }
    };
    return {
      handleSignupClick,
      handleSaveClick,
      isLoggedIn,
      userType, // Make userType accessible in the template
    };
  },
  computed: {
    isSignedUp() {
      return this.signedUpEventIds.includes(this.event.id); // Check if the event ID is in signedUpEventIds
    },
    currentUser() {
      return this.user || {
        uid: Cookies.get('uid') || sessionStorage.getItem('uid'),
        email: Cookies.get('email') || sessionStorage.getItem('email'),
        name: Cookies.get('username') || sessionStorage.getItem('username')
      };
    },
    // Convert Firebase Timestamp to readable date string for eventDate
    formattedEventDate() {
      const date = this.convertTimestampToDate(this.event.eventDate);
      return date ? this.formatDate(date) : 'Date not available';
    },
    formattedRegistrationDeadline() {
      const date = this.convertTimestampToDate(this.event.registrationDeadline);
      return date ? this.formatDate(date) : 'Date not available';
    },
    formattedEventTime() {
      const startDate = this.convertTimestampToDate(this.event.eventDate);
      if (!startDate) return 'Time not available';

      // Format the start time
      const startTime = startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      // Calculate the end time by adding the duration in hours
      const duration = Number(this.event.duration) || 0;
      if (duration <= 0) return `${startTime} - Invalid duration`;

      const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
      const endTime = endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      return `${startTime} - ${endTime}`;
    },
    badgeText() {
      return this.isClosed ? "Closed" : this.isClosingSoon ? "Closing soon" : "Open";
    },
    badgeClass() {
      return this.isClosed ? "badge-secondary" : this.isClosingSoon ? "badge-danger" : "badge-success";
    },
    isClosingSoon() {
      const deadline = this.event.registrationDeadline;
      const today = new Date();

      const deadlineDate = deadline && typeof deadline.toDate === 'function' ? deadline.toDate() : deadline;
      if (!deadlineDate) return false;

      const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      return deadlineDate <= twoWeeksLater && deadlineDate > today;
    },
    isClosed() {
      const today = new Date();
      const deadline = this.event.registrationDeadline;
      const deadlineDate = deadline && typeof deadline.toDate === 'function' ? deadline.toDate() : deadline;

      return today > deadlineDate;
    },
    isUserLoggedIn() {
      // Replace this with actual logic to check if the user is logged in
      return !!this.$store.state.user || this.uid;
    },
    uid() {
      return Cookies.get('uid') || sessionStorage.getItem('uid')
    },
  },
  methods: {
    closeModal() {
      this.$emit('close'); // Emit a close event to the parent
      document.body.style.overflow = 'auto'; 
    },
    convertTimestampToDate(timestamp) {
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      if (timestamp instanceof Date || typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      if (typeof timestamp === 'string') {
        return new Date(timestamp);
      }
      return null;
    },
    formatDate(date) {
      if (!date) return 'Date not available';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    },
  },
  mounted() {
    document.body.style.overflow = 'hidden'; // Disable scrolling when modal opens
  },
  destroyed() {
    document.body.style.overflow = 'auto'; // Enable scrolling when modal is closed
  }
}

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 25px;
  border-radius: 8px;
  max-width: 500px;
  max-height: 80vh;
  width: 90%;
  overflow-y: auto;
  border: 2px solid #ccc;
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

img {
  width: 100%;
}
.btn {
  padding: 5px 15px;
  border: 1px solid #085c44;
  border-radius: 30px;
  color: #085c44;
  display: inline-flex;
  align-items: center;
  justify-content: center; 
  margin-top: 10px;
  cursor: pointer;
  width: 30%;
}

.btn:hover {
  background-color: #085c44;
  color: white;
}
</style>