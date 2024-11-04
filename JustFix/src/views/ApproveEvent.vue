<template>
    <div class="container mt-5 pt-4">
      <h2 class="mb-4">Admin - Approve Event Requests</h2>
      <div v-if="getEventRequests.length === 0" class="text-center">
        <p>No pending requests at the moment.</p>
      </div>
      <div class="row">
        <div
          v-for="event in getEventRequests"
          :key="event.id"
          class="col-lg-6 col-md-12 mb-4 d-flex align-items-stretch"
        >
          <div class="event-request p-4 rounded shadow-sm d-flex flex-column justify-content-between">
            <div>
              <p><strong>Name:</strong> {{ event.name }}</p>
              <p><strong>Contact:</strong> {{ event.phone || "No contact provided" }}</p>
              <p><strong>Email:</strong> {{ event.email }}</p>
              <p><strong>Category:</strong> {{ event.selectedCategories ? event.selectedCategories.join(', ') : 'No categories specified' }}</p>
              <p><strong>Details:</strong> {{ event.details }}</p>
              <p><strong>Event Date:</strong> {{ formatDate(event.eventDate) }}</p>
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
  import { db } from "../main";
  import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
  
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
            // Convert Timestamp fields to Date objects if necessary
            const eventDate = event.eventDate && event.eventDate.toDate ? event.eventDate.toDate() : event.eventDate;
            const registrationDeadline = event.registrationDeadline && event.registrationDeadline.toDate ? event.registrationDeadline.toDate() : event.registrationDeadline;

            // Add event to the events collection
            const eventsCollection = collection(db, "events");
            await addDoc(eventsCollection, {
            title: event.title || "Untitled Event",
            description: event.details || "No description provided.",
            eventDate: eventDate || new Date(),
            registrationDeadline: registrationDeadline || new Date(),
            locationName: event.locationName || "Location not specified",
            address: event.address || "Address not provided",
            expertise: event.expertise || "No expertise specified",
            duration: event.duration || "Duration not specified",
            price: event.price || 0,
            totalSlots: event.totalSlots || 0,
            vacantSlots: event.vacantSlots || 0,
            createdAt: new Date()
            });

            // Update status to "approved" in eventRequest collection
            await updateDoc(doc(db, "eventRequest", event.id), { status: "approved" });
            console.log(`Event "${event.title}" approved and added to events collection.`);
            
            // Refresh the event requests list
            this.fetchEventRequests(); // Refresh the list to remove approved event from view
        } catch (error) {
            console.error("Error approving event:", error);
        }
        },
      async rejectEvent(id) {
        try {
          // Set the status to "rejected" in the eventRequest collection
          await updateDoc(doc(db, "eventRequest", id), { status: "rejected" });
  
          // Optionally remove the rejected request from the local state to reflect changes immediately
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
      }
    }
  };
  </script>
  
  <style scoped>
  .event-request {
    background-color: #f9f9f9;
    border: 1px solid #ddd;
    min-height: 300px; 
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .event-request p {
    margin-bottom: 0.5rem;
  }
  
  button {
    padding: 8px 12px;
    width: 48%;
  }
  
  button:hover {
    color: #fff;
  }
  </style>
  