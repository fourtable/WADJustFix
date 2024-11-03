<template>
  <div class="card event-card"   @click="$emit('cardClicked', event)">
    <div class="img-container position-relative">
      <img :src="event.image" class="card-img-top" alt="Event Image">
    </div>
    <div class="card-body">
      <h5 class="card-title">{{ event.title }}</h5>
      <p class="card-text">Registration Deadline: {{ formattedRegistrationDeadline }}</p>
      <p class="card-text">Event Date: {{ formattedEventDate }}</p>
      <span class="badge" :class="badgeClass">
        {{ badgeText }}
      </span>
    </div>
  </div>
</template>

<script>
import { Timestamp } from "firebase/firestore";

export default {
  props: {
    event: {
      type: Object,
      required: true
    }
  },
  computed: {
    // Convert Firebase Timestamp to readable date string for registrationDeadline
    formattedRegistrationDeadline() {
      return this.event.registrationDeadline
        ? this.convertTimestampToDate(this.event.registrationDeadline)
        : "N/A";
    },
    // Convert Firebase Timestamp to readable date string for eventDate
    formattedEventDate() {
      return this.event.eventDate
        ? this.convertTimestampToDate(this.event.eventDate)
        : "N/A";
    },
    // This computed property determines if the event is closing soon (within two weeks)
    isClosingSoon() {
      const today = new Date();
      const registrationDeadline = this.event.registrationDeadline.toDate(); // Convert Firestore Timestamp to JS Date
      const twoWeeksBeforeDeadline = new Date(registrationDeadline.getTime() - 14 * 24 * 60 * 60 * 1000);
      return today >= twoWeeksBeforeDeadline && today < registrationDeadline;
    },
    badgeText() {
      return this.isClosingSoon ? "Closing soon" : "Open";
    },
    badgeClass() {
      return this.isClosingSoon ? "badge-danger" : "badge-success";
    }
  },
  methods:{
      // Helper method to convert Firebase Timestamp to 'YYYY-MM-DD' format
      convertTimestampToDate(timestamp) {
      const date = timestamp.toDate(); // Convert Firebase Timestamp to JavaScript Date
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`; // Format as 'YYYY-MM-DD'
    }
  }
};
</script>

<style scoped>
.event-card {
  width: 300px;
  height: 380px;
  margin-bottom: 10px;
  padding: 0px;
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.event-card:hover {
  transform: scale(1.05);
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
}
.img-container {
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  overflow: hidden;
  height: 180px;
}
h5{
  font-size: medium;
}
.badge{
  padding:3%;
  border-radius: 10px;
}
.badge-danger {
  background-color: #d9534f;
}
.badge-success {
  background-color: #5cb85c;
}
</style>