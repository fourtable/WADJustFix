<template>
   <div class="event-signup-container">
  <div class="container-fluid mt-5 p-5">
    <button @click="goBack" class="back mb-3"><</button>
    <h2 v-if="eventData">Sign up for {{ eventData.title }}</h2>

    <form @submit.prevent="submitForm" v-if="!formSubmitted">
      <div class="mb-3">
        <label for="name">Name</label>
        <input type="text" id="name" v-model="form.name" placeholder="Enter your Name" class="form-control" required>
      </div>

      <div class="mb-3">
        <label for="email">Email</label>
        <input type="email" id="email" v-model="form.email" placeholder="Enter your Email" class="form-control"
          required>
      </div>

      <div class="mb-3">
        <label for="experienceLevel">Experience Level</label>
        <select v-model="form.experienceLevel" class="form-control" required>
          <option disabled value="">Select your experience level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
      </div>

      <div class="mb-3">
        <input class="form-check-input" type="checkbox" id="terms" v-model="form.agreeToTerms" required />
        <label class="form-check-label" for="terms">I agree to the terms and conditions</label>
      </div>

      <button type="submit" class="btn">Submit</button>
    </form>

    <div v-if="formSubmitted" class="success-message">
      <p>Thank you for your sign up! Your sign up has been successfully submitted. We will review it and get back to you
        within 2-3 business days or you can check your email for updates.</p>
    </div>
  </div>
</div>
</template>

<script>
import { db } from "../main"; // Import your Firebase instance
import { collection, addDoc, arrayUnion, doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import Cookies from 'js-cookie';

export default {
  data() {
    return {
      event: null,//initialise event data
      form: {
        organiserId: '',
        name: "",
        // email: "",
        experienceLevel: "",
        agreeToTerms: false,
      },
      formSubmitted: false,
    };
  },
  computed: {
    // Access event and user data from Vuex
    eventData() {
      return this.$store.state.eventData;
    },
    userData() {
      return this.$store.state.userData;
    }
  },
  async created() {
    // Auto-populate form with user data
    // if (this.userData) {
    // this.form.name = this.userData.name || "";
    // console.log(this.userData);
    // this.form.email = this.userData.email || "";
    // } else {
    // Fallback: Retrieve from session storage or cookies
    const username = sessionStorage.getItem('username') || Cookies.get('username');
    const userEmail = sessionStorage.getItem('email') || Cookies.get('email');
    if (username) this.form.name = username;
    if (userEmail) this.form.email = userEmail;

    // Fetch additional details from Firestore if needed
    const uid = sessionStorage.getItem('uid') || Cookies.get('uid');
    if (uid) {
      try {
        const userDoc = await this.getUserDetails(uid);
        if (userDoc) {
          this.form.name = userDoc.name || this.form.name;
          this.form.email = userDoc.email || this.form.email;
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }

    console.log("Event data in EventSignup.vue after fallback:", this.eventData);
    console.log("User data in EventSignup.vue after fallback:", this.userData);
  },
  methods: {
    goBack() {
      document.body.style.overflow = 'auto';
      this.$router.push('/event'); // Navigate to the events page
    },
    async getUserDetails(uid) {
      try {
        const userDoc = doc(db, "users", uid);
        const userSnapshot = await getDoc(userDoc);
        if (userSnapshot.exists()) {
          return userSnapshot.data();
        }
        return null;
      } catch (error) {
        console.error("Error fetching user details:", error);
        return null;
      }
    },
    async submitForm() {
      if (!this.eventData) {
        this.showNotification("Event data is not available.", 'alert');
        return;
      }
      // Fallback to session storage if `user` data is not in Vuex
      const uid = this.user?.uid || sessionStorage.getItem('uid') || Cookies.get('uid');
      if (!uid) {
        this.showNotification("User data not available. Please log in.", 'alert');
        return;
      }

      // Proceed with the existing submit logic
      const eventId = this.eventData.id;
      console.log(this.eventData);
      try {
        const userDocRef = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);

        const eventDocRef = doc(db, "events", eventId);
        const eventDocSnap = await getDoc(eventDocRef);

        if (!eventDocSnap.exists()) {
          this.showNotification("Event not found.", 'alert');
          return;
        }
        //move this logic to when they press signup button at popup
        const eventData = eventDocSnap.data();
        if (eventData.vacantSlots <= 0) {
          this.showNotification("No vacant slots available.", 'alert');
          return;
        }
        // // Define the event object to be saved in `signedupevents`
        const eventToSave = {
          eventId,
          title: this.eventData.title,
          description: this.eventData.description,
          eventDate: this.eventData.eventDate,
          locationName: this.eventData.locationName,
          address: this.eventData.address,
          duration: this.eventData.duration,
          organiserID: this.eventData.organiserID,
          // vacantSlots: this.event.vacantSlots,
          // totalSlots: this.event.totalSlots,
        };
        console.log(this.eventData.organiserID);
        console.log(eventToSave);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const existingEvents = userData.signedUpEvents || [];
          const alreadySignedUp = existingEvents.some(signedUpEvents => signedUpEvents.eventId === eventId);

          if (alreadySignedUp) {
            this.showNotification("You are already signed up for this event.", 'alert');
            return;
          }
          // Update user's signedUpEvents by adding the new event
          await updateDoc(userDocRef, {
            signedUpEvents: arrayUnion(eventToSave)
          });
        } else {
          // If user document doesn't exist, create it with `signedupevents` field
          await setDoc(userDocRef, {
            signedUpEvents: [eventToSave]
          });
        }

        // Decrement the `vacantSlots` count in the event document
        await updateDoc(eventDocRef, {
          vacantSlots: increment(-1)
        });

        const pointCollection = collection(db, 'points');
        // for user (fixer)
        await addDoc(pointCollection, {
            Date: this.eventData.eventDate,
            UID: uid,
            points: 10,
            type: "earn",
            description: `Signed up for ${this.eventData.title}`
        });
        // Optionally, reset form or navigate as needed
        this.formSubmitted = true;
      } catch (error) {
        console.error("Error submitting form:", error);
        this.showNotification("There was an error during the signup process. Please try again.","alert");
      }
    },
    resetForm() {
      this.form = {
        name: "",
        phone: "",
        email: "",
        experienceLevel: "",
        agreeToTerms: false,
      };
      this.formSubmitted = false;
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
  mounted() {
    // If you need to prevent scrolling on EventSignup
    document.body.style.overflow = 'hidden';
  },
  beforeDestroy() {
    // Reset the overflow style when the component is destroyed
    document.body.style.overflow = 'auto';
  },
  beforeRouteLeave(to, from, next) {
    // Ensure scrolling is re-enabled on the main page
    document.body.style.overflow = 'auto';
    next();
  }
};
</script>

<style scoped>
.event-signup-container {
  height: 100vh; /* Full viewport height */
  overflow-y: auto; /* Enables scrolling if content overflows */
}
.container-fluid {
  max-width: 600px;
  /* Limits the width */
  width: 90%;
  /* Responsive width for smaller screens */
  margin: 0 auto;
}

.organize-event-form {
  max-width: 600px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #f9f9f9;
}

.form-control {
  border-radius: 20px;
  padding: 10px;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.btn {
  padding: 5px 10px;
  border: 1px solid #085c44;
  border-radius: 30px;
  color: #085c44;
  display: inline-flex;
  align-items: center;
  /* margin-top: 5px; */
  cursor: pointer;
}

.btn:hover {
  background-color: #085c44;
  color: white;
}

.back {
  padding: 5px 10px;
  border: 1px solid #085c44;
  border-radius: 30px;
  color: #085c44;
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  cursor: pointer;
  background-color: white;
}
</style>