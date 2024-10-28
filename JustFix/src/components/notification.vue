<template>
    <div>
      <!-- Correct Comment -->
      <b-toast
        v-for="(notification, index) in notifications"
        :key="index"
        title="New Message"
        variant="info"
        auto-hide-delay="5000"
        @dismissed="removeNotification(index)"
      >
        {{ notification.message }}
      </b-toast>
    </div>
  </template>

<script>
import { computed } from 'vue';
import store from '../store/store';

export default {
    setup() {
        const notifications = computed(() => {
            console.log("Current notifications:", store.state.notifications); // Log current notifications
            return store.state.notifications;
        });

        const removeNotification = (index) => {
            store.dispatch('removeNotification', index);
        };

        return { notifications, removeNotification };
    },
};
</script>

<style></style>