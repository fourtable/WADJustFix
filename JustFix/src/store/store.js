import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { db } from '../plugins/firebaseManager'; // Import db from firebaseManager
import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      userName: "",
      repairmen: [],
      currentProfileId: null,
      notificationsList: [], // Array to hold notifications
      userQuotes: []
    };
  },
  mutations: {
    setUserName(state, userName) {
      state.userName = userName;
    },
    setRepairmen(state, repairmen) {
      state.repairmen = repairmen;
    },
    setCurrentProfileId(state, id) {
      state.currentProfileId = id; // Store the currently viewed profile's id
    },
    setUserQuotes(state, quotes) {
      state.userQuotes = quotes; // Mutation to set user quotes
    },
    ADD_NOTIFICATION(state, notification) {
      console.log('Current notifications:', state.notificationsList);
      console.log('Adding notification:', notification);
      state.notificationsList.push(notification);
      console.log('Current notifications:', state.notificationsList);
    },
    REMOVE_NOTIFICATION(state, id) {
      state.notificationsList = state.notificationsList.filter(
        (notification) => notification.id !== id
      );
    },
  },
  actions: {
    notificationsList: (state) => state.notificationsList,
    addNotification({ commit }, notification) {
      commit('ADD_NOTIFICATION', notification);
    },
    updateUserName({ commit }, userName) {
      commit('setUserName', userName);
    },
    async fetchRepairmen({ commit }) {
      try {
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
      } catch (error) {
        console.error("Error fetching repairmen:", error); // Error handling
      }
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
    updateCurrentProfileId({ commit }, id) {
      commit('setCurrentProfileId', id);
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
    getCurrentProfileId(state) { // Optional: Get current profile id
      return state.currentProfileId;
    },
    addNotification({ commit }, notification) {
      commit('ADD_NOTIFICATION', notification);
    },
    removeNotification({ commit }, id) {
      commit('REMOVE_NOTIFICATION', id);
    },
    notificationsList(state) {
      return state.notificationsList;
  },
    getUserQuotes(state) {
      return state.userQuotes; // Getter for user quotes
    },
  },
});

export default store;
