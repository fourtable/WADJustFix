// store.js
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { db } from '../plugins/firebaseManager'; // Import db from firebaseManager
import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      userName: "",
      repairmen: [],
      currentProfileId: null, // Optional: track current profile ID
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
  },
  actions: {
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
    updateCurrentProfileId({ commit }, id) {
      commit('setCurrentProfileId', id); // Action to update profile id
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
  },
});

export default store;
