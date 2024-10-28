// store.js
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { db } from '../plugins/firebaseManager'; // Import db from firebaseManager
import { createStore } from 'vuex';

const store = createStore({
  state() {
    return {
      userName: "",
      repairmen: [],
    };
  },
  mutations: {
    setUserName(state, userName) {
      state.userName = userName;
    },
    setRepairmen(state, repairmen) {
      state.repairmen = repairmen;
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
  },
  getters: {
    getUserName(state) {
      return state.userName;
    },
    getRepairmen(state) {
      return state.repairmen;
    },
  },
});

export default store;