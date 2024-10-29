<template>
  <div class="toast-container position-fixed top-2 end-0 p-3 mt-3">
    <div v-for="(notification, index) in notificationsList" :key="notification.id" class="toast" role="alert"
      aria-live="assertive" aria-atomic="true" :class="{ show: notification.isVisible }"
      @transitionend="removeNotification(index)" style="margin-top: 10px;">
      <div class="toast-header">
        <strong class="me-auto">New Message from {{ notification.name }}</strong>
        <button type="button" class="btn-close" @click="removeNotification(index)" aria-label="Close"></button>
      </div>
      <div class="toast-body d-flex justify-content-between align-items-center">
        {{ notification.message }} <!-- Ensure message is displayed here -->
        <small class="text-muted ms-auto">{{ notification.timestamp }}</small> <!-- Optionally display timestamp -->
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ref as dbRef, onValue, push, remove } from 'firebase/database';
import { realtimeDb } from '../main';
import Cookies from 'js-cookie';

export default {
  setup() {
    const notificationsList = ref([]);

    const setupNotificationListener = (uid) => {
      const notificationsRef = dbRef(realtimeDb, `notifications/${uid}`);
      onValue(notificationsRef, (snapshot) => {
        const notifications = snapshot.val(); // Get all notifications
        if (notifications) {
          notificationsList.value = []; // Clear previous notifications
          Object.entries(notifications).forEach(([id, notificationData]) => {
            notificationsList.value.push({
              id,
              name: notificationData.senderName,
              message: notificationData.message,
              timestamp: formatTimestamp(notificationData.timestamp),
              isVisible: true,
            });
            // console.log('Notification added:', { id, notificationData }); // Log notification details
          });
        }
      });
    };

    function formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0'); // Ensure minutes are two digits
      const ampm = hours >= 12 ? 'PM' : 'AM'; // Determine AM or PM
      hours = hours % 12; // Convert to 12-hour format
      hours = hours ? hours : 12; // The hour '0' should be '12'

      return `${hours}:${minutes} ${ampm}`; // Format as 'hh:mm AM/PM'
    }

    const sendNotification = async (receiverId, senderId) => {
      const notificationRef = dbRef(realtimeDb, `notifications/${receiverId}`);
      await push(notificationRef, {
        message: `${senderId} sent you a message`,
        timestamp: new Date().toISOString(),
      });
    };

    const removeNotification = async (index) => {
      const notificationId = notificationsList.value[index].id;
      notificationsList.value.splice(index, 1); // Remove from the list

      const notificationRef = dbRef(
        realtimeDb,
        `notifications/${Cookies.get('uid') || sessionStorage.getItem('uid')}/${notificationId}`
      );
      await remove(notificationRef)
      // .then(() => console.log('Notification removed successfully.'))
      // .catch((error) => console.error('Error removing notification:', error));
    };

    onMounted(() => {
      const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
      if (uid) {
        setupNotificationListener(uid);
      }

      // Test notification for debugging
      // notificationsList.value.push({
      //   id: 'test-notification',
      //   message: 'This is a test notification',
      //   isVisible: true, // Mark as visible
      // });
    });

    return {
      notificationsList,
      sendNotification,
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