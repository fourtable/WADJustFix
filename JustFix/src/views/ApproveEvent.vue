<template>
  <div class="container mt-5 pt-4">
    <h2 class="mb-4">Admin - Approve Event Requests</h2>
    <div v-if="getEventRequests.length === 0" class="text-center">
      <p>No pending requests at the moment.</p>
    </div>
    <div class="row">
      <div v-for="event in getEventRequests" :key="event.id" class="col-lg-6 col-md-12 mb-4 d-flex align-items-stretch">
        <div class="event-request p-4 rounded shadow-sm d-flex flex-column justify-content-between">
          <div class="image-container">
            <img v-if="event.imageUrl" :src="event.imageUrl" alt="Event Image" class="event-image" />
          </div>
          <div class="event-details">
            <p><strong>Title:</strong> {{ event.title || "Untitled Event" }}</p>
            <p><strong>Name:</strong> {{ event.name || "No name provided" }}</p>
            <p><strong>Contact:</strong> {{ event.phone || "No contact provided" }}</p>
            <p><strong>Email:</strong> {{ event.email || "No email provided" }}</p>
            <p><strong>Category:</strong> {{ event.category ? event.category.join(', ') : 'No categories specified' }}
            </p>
            <p><strong>Description:</strong> {{ event.description || "No description provided" }}</p>
            <p><strong>Event Date:</strong> {{ formatDate(event.eventDate) }}</p>
            <p><strong>Registration Deadline:</strong> {{ formatDate(event.registrationDeadline) }}</p>
            <p><strong>Duration:</strong> {{ event.duration || "Duration not specified" }} hours</p>
            <p><strong>Price:</strong> ${{ event.price || 0 }}</p>
            <p><strong>Total Slots:</strong> {{ event.totalSlots || 0 }}</p>
            <p><strong>Status:</strong> {{ event.status || "pending" }}</p>
          </div>
          <div class="d-flex justify-content-between mt-4">
            <button @click="approveEvent(event)" class="btn btn-success">Approve</button>
            <button @click="rejectEvent(event.id)" class="btn btn-danger">Reject</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { db, realtimeDb} from "../main";
import { collection, getDoc, addDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { ref as dbRef, get, query as dbquery, set, onValue, update, push, remove } from 'firebase/database';

export default {
  computed: {
    ...mapGetters(['getEventRequests']) // Access event requests from Vuex store
  },
  mounted() {
    this.fetchEventRequests(); // Fetch event requests on component mount
  },
  methods: {
    ...mapActions(['fetchEventRequests']), // Fetch real-time updates from Vuex store
    async approveEvent(event) {
      try {
        const eventDate = event.eventDate && event.eventDate.toDate ? event.eventDate.toDate() : event.eventDate;
        const registrationDeadline = event.registrationDeadline && event.registrationDeadline.toDate ? event.registrationDeadline.toDate() : event.registrationDeadline;

        const eventsCollection = collection(db, "events");
        const docRef = await addDoc(eventsCollection, {
          organiserID: event.organiserID,
          title: event.title || "Untitled Event",
          description: event.description || "No description provided.",
          eventDate: eventDate || new Date(),
          registrationDeadline: registrationDeadline || new Date(),
          address: event.address || '',
          name: event.name || "No name provided",
          email: event.email || "No email provided",
          category: event.category || [], // Ensure it matches the Firebase data structure
          duration: event.duration || "Duration not specified",
          totalSlots: event.totalSlots || 0,
          vacantSlots: event.vacantSlots,
          imageUrl: event.imageUrl || "", // Include the image URL
          createdAt: new Date()
        });
        
        await this.sendNotification(event.organiserID, event.title + " has been approved!", 'JustFix')
        await updateDoc(doc(db, "eventRequest", event.id), { status: "approved" });
        console.log(`Event "${event.title}" approved and added to events collection.`);

        const newEventId = 'uqMHmH0RZbUj7ZNKlM02';

        const userDocRef = doc(db, "users", 'OxkuOPkzMeZAdrs59tqy01GyEEh2'); // Assuming `userId` is provided in the event object
        const userDocSnap = await getDoc(userDocRef);
        // Create an event object with minimal data to store in the user's signedUpEvents array
        const eventToSave = {
          address: event.address,
          eventId: newEventId,
          title: event.title || "Untitled Event",
          eventDate: event.eventDate.toDate() || new Date(),
          description: event.description || "No description provided.",
          // Add other necessary fields as required, for example:
          location: event.location || "Not provided",
          organiserId: event.organiserID,
        };

        // Step 4: Update the user's document to add the new event to their signedUpEvents array

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const existingEvents = userData.signedUpEvents || [];
          const alreadySignedUp = existingEvents.some(signedUpEvents => signedUpEvents.eventId === newEventId);
          // console.log(existingEvents);
          // console.log(alreadySignedUp);
          // console.log(eventToSave);
          if (alreadySignedUp) {
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

        this.fetchEventRequests(); // Refresh the list to remove approved event from view
      } catch (error) {
        console.error("Error approving event:", error);
      }
    },
    async rejectEvent(id) {
      try {
        await updateDoc(doc(db, "eventRequest", id), { status: "rejected" });

        this.fetchEventRequests(); // Refresh the list to remove rejected event from view
        console.log(`Event request with ID ${id} has been rejected.`);
      } catch (error) {
        console.error("Error rejecting event:", error);
      }
    },
    formatDate(date) {
      if (date && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleString();
      }
      return "No date available";
    },
    async sendNotification (receiverId, message, name){
      const notificationRef = dbRef(realtimeDb, `notifications/${receiverId}`);
      await push(notificationRef, {
        notificationType: 'message',
        senderId: 'admin',
        senderName: name,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
      });
      // console.log('Notification sent to:', receiverId);
    },
  }
};
</script>

<style scoped>
.event-request {
  border: 1px solid #ddd;
  background-color: #f9f9f9;
}

.image-container {
  width: 100%;
  height: 200px;
  /* Adjust the height as needed */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 8px;
  margin-bottom: 15px;
  background-color: #f1f1f1;
  /* Optional: Adds a background color if images have transparent areas */
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* Change to 'contain' to avoid cropping */
  object-position: center;
}

;

.event-details {
  text-align: left;
}
</style>
