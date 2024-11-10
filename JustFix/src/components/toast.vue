<template>
  <div class="toast-container position-fixed top-2 end-0 p-3 mt-3">
    <div v-for="(notification, index) in notificationsList" :key="notification.id" class="toast" role="alert"
      aria-live="assertive" aria-atomic="true" :class="{ show: notification.isVisible }"
      @transitionend="removeNotification(index)" style="margin-top: 10px;">
      <div v-if="notification.type == 'message'">
        <div class="toast-header">
          <strong class="me-auto">New Message from {{ notification.name }}</strong>
          <button type="button" class="btn-close" @click="removeNotification(index)" aria-label="Close"></button>
        </div>
        <div class="toast-body d-flex justify-content-between align-items-center">
          {{ notification.message }} <!-- Ensure message is displayed here -->
          <small class="text-muted ms-auto">{{ notification.timestamp }}</small> <!-- Optionally display timestamp -->
        </div>
      </div>
      <div v-if="notification.type == 'alert'">
        <div class="toast-header">
          <strong class="me-auto">Alert</strong>
          <button type="button" class="btn-close" @click="removeNotification(index)" aria-label="Close"></button>
        </div>
        <div class="toast-body d-flex justify-content-between align-items-center">
          {{ notification.message }} <!-- Ensure message is displayed here -->
          <!-- <small class="text-muted ms-auto">{{ notification.timestamp }}</small> Optionally display timestamp -->
        </div>
      </div>
      <div v-if="notification.type == 'success'">
        <div class="toast-header">
          <strong class="me-auto">Success</strong>
          <button type="button" class="btn-close" @click="removeNotification(index)" aria-label="Close"></button>
        </div>
        <div class="toast-body d-flex justify-content-between align-items-center">
          {{ notification.message }} <!-- Ensure message is displayed here -->
          <!-- <small class="text-muted ms-auto">{{ notification.timestamp }}</small> Optionally display timestamp -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ref as dbRef, onValue, push, remove } from 'firebase/database';
import { realtimeDb } from '../main';
import Cookies from 'js-cookie';
import { useStore } from 'vuex';
import { mapGetters } from 'vuex'; // Import mapGetters

export default {
  methods: {
    showNotification(message, type) {
      const notification = {
        type: type,
        message: message,
        timestamp: new Date().toISOString(),
        isVisible: true,
        duration: 5000,
      };
      this.$store.dispatch('addNotification', notification); // Dispatch the action to add notification

      setTimeout(() => {
        removeNotification(notification.id); // Close the notification after 5 seconds
      }, notification.duration);
    },
  },
  computed: {
    ...mapGetters(['notificationsList']), // Map the notifications list
  },
  setup() {
    const store = useStore();
    const notificationsList = ref(store.getters.notificationsList);

    const setupNotificationListener = (uid) => {
      const notificationsRef = dbRef(realtimeDb, `notifications/${uid}`);
      onValue(notificationsRef, (snapshot) => {
        const notifications = snapshot.val(); // Get all notifications
        if (notifications) {
          notificationsList.value = []; // Clear previous notifications
          Object.entries(notifications).forEach(([id, notificationData]) => {
            notificationsList.value.push({
              id,
              type: notificationData.notificationType,
              name: notificationData.senderName,
              message: notificationData.message,
              timestamp: formatTimestamp(notificationData.timestamp),
              isVisible: true,
            });
            store.dispatch('addNotification', {
              type: notificationData.type,
              message: notificationData.message,
              timestamp: notificationData.timestamp,
              isVisible: true,
            }); // Add to Vuex 
          });
        }
      });
    };

    const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0'); // Ensure minutes are two digits
      const ampm = hours >= 12 ? 'PM' : 'AM'; // Determine AM or PM
      hours = hours % 12; // Convert to 12-hour format
      hours = hours ? hours : 12; // The hour '0' should be '12'

      return `${hours}:${minutes} ${ampm}`; // Format as 'hh:mm AM/PM'
    };

    const removeNotification = async (index) => {
      const notification = notificationsList.value[index]; // Get the notification to be removed

      // Dispatch an action to remove the notification from Vuex
      store.dispatch('removeNotification', notification.id); // Ensure you have a Vuex action to handle this

      // Remove the notification from Firebase (if necessary)
      const notificationRef = dbRef(realtimeDb, `notifications/${Cookies.get('uid') || sessionStorage.getItem('uid')}/${notification.id}`);
      await remove(notificationRef); // Remove from Firebase

      // Optionally, remove from local notifications list
      notificationsList.value.splice(index, 1); // Remove the notification from the local list
    };

    onMounted(() => {
      const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
      if (uid) {
        setupNotificationListener(uid);
      }
    });

    return {
      notificationsList,
      removeNotification,
    };
  },
};
</script>

<style>
.toast-container {
  z-index: 1050;
  /* Ensure toasts appear above other content */
  top: 60px;
  /* Adjust this value based on the height of your navigation bar */
}

.toast {
  opacity: 0;
  transition: opacity 0.5s ease;
}

.toast.show {
  opacity: 1;
  /* Show toast */
}
</style>
