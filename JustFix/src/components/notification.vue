<template>
    <div v-if="notifications.length > 0" class="toast-container position-fixed bottom-0 end-0 p-3">
        <div
            class="toast"
            v-for="(notification, index) in notifications"
            :key="index"
            @animationend="removeNotification(index)"
        >
            <div class="toast-header">
                <strong class="me-auto">New Message</strong>
                <button type="button" class="btn-close" aria-label="Close" @click="removeNotification(index)"></button>
            </div>
            <div class="toast-body">{{ notification.message }}</div>
        </div>
    </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
// import { state } from '../store/notificationStore.js';

export default {
    setup() {
        const store = useStore();
        const notifications = computed(() => store.state.notifications);

        const removeNotification = (index) => {
            store.dispatch('removeNotification', index);
        };

        return { notifications, removeNotification };
    },
};
</script>
