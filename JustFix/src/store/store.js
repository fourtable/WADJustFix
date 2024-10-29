// store.js
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { db } from '../plugins/firebaseManager'; // Import db from firebaseManager
import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      userName: "",
      repairmen: [],
      notifications: [], // Array to hold notifications
    };
  },
  mutations: {
    setUserName(state, userName) {
      state.userName = userName;
    },
    setRepairmen(state, repairmen) {
      state.repairmen = repairmen;
    },
    ADD_NOTIFICATION(state, notification) {
      state.notifications.push(notification);
    },
    REMOVE_NOTIFICATION(state, index) {
      state.notifications.splice(index, 1);
    },
  },
  actions: {
    updateUserName({ commit }, userName) {
      commit('setUserName', userName);
    },
    async fetchRepairmen({ commit }) {
      const repairmenQuery = query(collection(db, "users"), where("userType", "==", "repairer"));
      const querySnapshot = await getDocs(repairmenQuery);
      let repairmen = [];
      querySnapshot.forEach((doc) => {
        repairmen.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      console.log('Fetched Repairmen:', repairmen); // Log fetched data

      commit("setRepairmen", repairmen);
    },
    addNotification({ commit }, notification) {
      console.log("Adding notification:", notification); // Log added notification
      commit('ADD_NOTIFICATION', notification);
  },
    removeNotification({ commit }, index) {
      console.log("Remove notification:");
      commit('REMOVE_NOTIFICATION', index);
    },
    async listenForNotifications({ dispatch }, uid) {
      const notificationsRef = collection(db, 'notifications');
      const notificationsQuery = query(notificationsRef, where('receiverId', '==', uid));

      // Listen for incoming notifications
      onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notificationData = change.doc.data();
            dispatch('addNotification', {
              message: notificationData.message,
              timestamp: notificationData.timestamp
            });
          }
        });
      });
    },
  },
  getters: {
    getUserName(state) {
      return state.userName;
    },
    getRepairmen(state) {
      return state.repairmen;
    },
    getNotifications(state) {
      return state.notifications;
    },
  },
});

export default store;
