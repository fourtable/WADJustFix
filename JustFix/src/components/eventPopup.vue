<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">✕</button>
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
      <p>Price: ${{ event.price }}</p>
      <p>Location: {{ event.locationName }}</p>
      <p>Address: {{ event.address }}</p>
      <p>Vacant Slots: {{ event.vacantSlots }}</p>
      <p>Registration Deadline: {{ formattedRegistrationDeadline }}</p>

      <!-- More event details as needed -->
      <div class="d-flex justify-content-between mt-3">
        <button class="btn" @click="saveEvent">Save Event</button>
        <button class="btn" @click="handleSignupClick">Sign Up!</button>
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

export default {
  props: {
    event: {
      type: Object,
      required: true
    },
    isVisible: Boolean
  },
  setup() {
    const router = useRouter();
    const handleSignUpClick = () => {
      const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
      if (!uid) {
        // Store event ID for redirect after login
        sessionStorage.setItem('pendingEventSignup', eventId);
        router.push('/login');
      } else {
        try {
          router.push({ 
            name: 'eventSignup', 
            params: { eventId: props.event.id }
          }).catch(err => {
            console.log('Trying alternative route...');
            router.push(`/eventSignup/${props.event.id}`);
          });
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }
    };
      return {
      handleSignUpClick
    };
  },
  computed: {
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
    async saveEvent() {
      const userDocRef = doc(db, "users", this.uid);

      try {
        const docSnap = await getDoc(userDocRef);

        // Define the new event object
        const newEvent = this.event;

        if (docSnap.exists()) {
          const existingEvents = docSnap.data().event || [];

          // Check if the new event already exists in the array
          const eventExists = existingEvents.some(event =>
            event.title === newEvent.title &&
            event.date === newEvent.date &&
            event.description === newEvent.description
          );

          if (!eventExists) {
            // Add new event to the array if it doesn't already exist
            await updateDoc(userDocRef, {
              event: arrayUnion(newEvent)
            });
            console.log("New event added to the array.");
            this.showNotification('Event added!', 'alert');
          } else {
            console.log("Event already exists, not adding duplicate.");
            this.showNotification('Event already added!', 'alert');
          }
        } else {
          // Document doesn't exist, create new one with the event
          await setDoc(userDocRef, {
            event: [newEvent]
          });
          console.log("User document created with the new event.");
        }
      } catch (error) {
        console.error("Error saving event: ", error);
      }
    },
    // navigateToSignUp() {
    //   // Check if the user is logged in
    //   if (!this.isUserLoggedIn) {
    //     // Use a confirm dialog to prompt the user
    //     const userAction = confirm("You need to log in to sign up. Would you like to log in or register?");
    //     if (userAction) {
    //       this.$router.push({ name: "login" });
    //     } else {
    //       this.$router.push({ name: "register" });
    //     }
    //   } else {
    //     // If the user is logged in, navigate to the signup page for the event
    //     this.$router.push({ name: "eventSignup", params: { eventId: this.event.id } });
    //   }
    // },
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
    async showNotification(message, type) {
      try {
        const notification = {
          type: type,
          message: message,
          timestamp: new Date().toISOString(),
          isVisible: true,
        };
        // console.log('Dispatching notification:', notification);
        this.$store.dispatch('addNotification', notification); // Dispatch the action to add notification
      }
      catch (error) {

      }
    },
  },
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
  width: 100%;
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
  padding: 5px 10px;
  border: 1px solid #085c44;
  border-radius: 30px;
  color: #085c44;
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  cursor: pointer;
  width: 30%;
}

.btn:hover {
  background-color: #085c44;
  color: white;
}
</style>