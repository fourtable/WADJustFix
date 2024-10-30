import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { db } from '../plugins/firebaseManager'; // Import db from firebaseManager
import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      userName: "",
      repairmen: [],
      notifications: [], // Array to hold notifications
      userQuotes: [] // Array to hold user's quotes
    };
  },
  mutations: {
    setUserName(state, userName) {
      state.userName = userName;
    },
    setRepairmen(state, repairmen) {
      state.repairmen = repairmen;
    },
    setUserQuotes(state, quotes) {
      state.userQuotes = quotes; // Mutation to set user quotes
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
    async fetchUserQuotes({ commit }, uid) { // Add this action
      try {
        const quotesQuery = query(collection(db, 'quotes'), where('uid', '==', uid)); // Query for user's quotes
        const querySnapshot = await getDocs(quotesQuery);
        const quotes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        commit('setUserQuotes', quotes); // Commit user quotes to state
      } catch (error) {
        console.error("Error fetching user quotes:", error);
      }
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
    getUserQuotes(state) {
      return state.userQuotes; // Getter for user quotes
    },
    getNotifications(state) {
      return state.notifications;
    },
  },
});

export default store;
