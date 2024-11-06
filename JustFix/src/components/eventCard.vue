<template>
  <div class="card event-card"   @click="$emit('cardClicked', event)">
    <div class="img-container position-relative">
      <img :src="event.image" class="card-img-top" alt="Event Image">
    </div>
    <div class="card-body">
      <h5 class="card-title">{{ event.title }}</h5>
      <p class="card-text">Registration Deadline: {{ formattedRegistrationDeadline }}</p>
      <p class="card-text">Event Date: {{ formattedEventDate }}</p>
      <p class="card-text">Time: {{ formattedEventTime }}</p>
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

      // Check if duration is a valid number
      const duration = Number(this.event.duration) || 0; // Ensure duration is a number 
      if (duration <= 0) return `${startTime} - Invalid duration`;

      // Calculate the end time by adding the duration in hours
      const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
      const endTime = endDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

      return `${startTime} - ${endTime}`;
    },
    // This computed property determines if the event is closing soon (within two weeks)
    isClosingSoon() {
      const deadline = this.event.registrationDeadline;
    const today = new Date();
    
    // Check if `registrationDeadline` is a Firestore Timestamp and convert if needed
    const deadlineDate = deadline && typeof deadline.toDate === 'function' 
      ? deadline.toDate()
      : deadline; // If it's already a Date or another type, use it directly

    if (!deadlineDate) {
      return false; // Return false if there's no deadline
    }

    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    return deadlineDate <= twoWeeksLater && deadlineDate > today;
  },
    
    // Check if the event is closed (past registration deadline)
    isClosed() {
      const today = new Date();
      const deadline = this.event.registrationDeadline;
      const deadlineDate = deadline && typeof deadline.toDate === 'function' ? deadline.toDate() : deadline;

      return today > deadlineDate;
    },
    badgeText() {
      if (this.isClosed) return "Closed";
      return this.isClosingSoon ? "Closing soon" : "Open";
    },
    badgeClass() {
      if (this.isClosed) return "badge-secondary";
      return this.isClosingSoon ? "badge-danger" : "badge-success";
    }
  },
  methods:{
      // Helper method to convert Firebase Timestamp to 'YYYY-MM-DD' format
      convertTimestampToDate(timestamp) {
      // Check if timestamp is a Firebase Timestamp
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      // If it's already a Date object or a timestamp number
      if (timestamp instanceof Date || typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      // If it's a string, try to parse it
      if (typeof timestamp === 'string') {
        return new Date(timestamp);
      }
      // Return null if invalid
      return null;
    },
    formatDate(date) {
      if (!date) return 'Date not available';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }
}

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
.badge-secondary {
  background-color: #6c757d;
  color: white;
}
</style>