<template>
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <button class="close-btn" @click="$emit('close')">✕</button>
        <img  src="https://placehold.co/130x70" class="card-img-top mb-2 mt-4 rounded-1" alt="Event Image" >
        <h3>{{ event.title }}</h3>
        <p>{{ event.description }}</p>
        <p>Event Date: {{ formattedEventDate }}</p>
        <p>Duration: {{ event.duration}}</p>
        <p>Price: ${{ event.price }}</p>
        <p>Location: {{ event.locationName }}</p>
        <p>Address: {{ event.address }}</p>
        <p>Vacant Slots: {{ event.vacantSlots }}</p>
        <!-- More event details as needed -->
  
        <button class="btn" @click="saveEvent">Save Event</button>
        <button class="btn" @click="navigateToSignUp">Sign Up Here!</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      event: Object,
      isVisible: Boolean
    },
    computed:{
        formattedEventDate() {
            return this.event.eventDate
            ? this.convertTimestampToDate(this.event.eventDate)
            : "N/A";
        },
        
    },
    methods: {
      saveEvent() {
        // Logic to save the event
      },
      navigateToSignUp(eventId) {
      this.$router.push({ name: 'eventSignup', params: { eventId } });
    },
      convertTimestampToDate(timestamp) {
      const date = timestamp.toDate(); // Convert Firebase Timestamp to JavaScript Date
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`; // Format as 'YYYY-MM-DD'
        }
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
  max-width: 400px;
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
img{
    width:100%;
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
  