import { collection, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { db } from '../plugins/firebaseManager'; // Import db from firebaseManager
import { createStore } from 'vuex';
import { auth } from "../main"; // Import getAuth from Firebase Auth
import Cookies from 'js-cookie';

const store = createStore({
  state() {
    return {
      userName: "",
      repairmen: [],
      currentProfileId: null,
      notificationsList: [], // Array to hold notifications
      quotes: [], // Store quotes for the user
      users: [], // Add users to state
      eventRequests: [] // Store event requests here

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
    setQuotes(state, quotes) {
      state.quotes = quotes; // Set quotes to the state
    },
    ADD_NOTIFICATION(state, notification) {
      state.notificationsList.push(notification);
    },
    REMOVE_NOTIFICATION(state, id) {
      const notification = state.notificationsList.find(n => n.id === id);
      if (notification) {
        notification.isVisible = false;
      }
    },
    setUsers(state, users) {
      state.users = users;
    },
    setEventRequests(state, eventRequests) {
      state.eventRequests = eventRequests;
    },
  },
  actions: {
    notificationsList: (state) => state.notificationsList,
    addNotification({ commit }, notification) {
      if (!notification.id) {
        notification.id = Date.now(); // Add unique ID if missing
      }
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
    async fetchUserQuotes({ commit }) {
      let userQuotesQuery = '';
      const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
      const userType = Cookies.get('userType') || sessionStorage.getItem('userType'); // Directly reference userType
      console.log(uid);
      console.log(userType);
      if (uid) {
        const quotesCollection = collection(db, 'quotes');
        if (userType === "user") { // Use the local userType
          userQuotesQuery = query(quotesCollection, where('userId', '==', uid));
        }
        else if (userType === "repairer") {
          userQuotesQuery = query(quotesCollection, where('repairerId', '==', uid));
        }
        else {
          userQuotesQuery = quotesCollection; // Fetch all if no specific user type
        }

        console.log(userQuotesQuery);

        // Use onSnapshot to listen for real-time updates
        onSnapshot(userQuotesQuery, (snapshot) => {
          const quotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          commit('setQuotes', quotes);
          console.log("Fetched Quotes:", quotesCollection); // Log the fetched quotes
          return quotes;
        });
      } else {
        console.log("User is not logged in");
      }
    },
    updateCurrentProfileId({ commit }, id) {
      commit('setCurrentProfileId', id);
    },
    removeNotification({ commit }, id) {
      console.log("Remove notification:");
      commit('REMOVE_NOTIFICATION', id);
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
    async fetchUsers({ commit }) {
      try {
        const usersCollection = collection(db, "users");
        const querySnapshot = await getDocs(usersCollection);
        let users = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Fetched Users:', users);
        commit("setUsers", users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    },
    fetchEventRequests({ commit }) {
      const eventRequestQuery = query(collection(db, "eventRequest"), where("status", "==", "pending"));
      onSnapshot(eventRequestQuery, (snapshot) => {
        const eventRequests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        commit("setEventRequests", eventRequests);
        console.log("Fetched Event Requests:", eventRequests);
      });
    },
    async updateEventStatus(_, { id, status }) {
      try {
        await updateDoc(doc(db, "eventRequest", id), { status });
      } catch (error) {
        console.error(`Error updating event status to ${status}:`, error);
      }
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
    notificationsList(state) {
      return state.notificationsList;
    },
    getUserQuotes(state) {
      return state.quotes; // Getter for quotes
    },
    getUsers(state) {
      return state.users;
    },
    getEventRequests(state) {
      return state.eventRequests;
    },
  },
});

export default store;
