<template>
    <div class="card event-card">
      <div class="img-container position-relative">
        <img :src="event.image" class="card-img-top" alt="Event Image">
      </div>
      <div class="card-body">
        <h5 class="card-title">{{ event.title }}</h5>
        <p class="card-text">Registration Date: {{ event.registrationDate }}</p>
        <p class="card-text">Event Date: {{ event.eventDate }}</p>
        <span class="badge" :class="event.isClosingSoon ? 'badge-danger' : 'badge-success'">
          {{ event.isClosingSoon ? 'Closing soon' : 'Open' }}
        </span>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      event: {
        type: Object,
        required: true
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
  