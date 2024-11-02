<template>
    <div class="container py-5" id="redeem-rewards">
      <NavBar />
  
      <div class="text-center mb-4">
        <h2>Your Points: {{ userPoints }}</h2>
      </div>
  
      <div class="rewards-list row">
        <div class="col-md-4 mb-3" v-for="reward in rewards" :key="reward.id">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">{{ reward.name }}</h5>
              <p class="card-text">{{ reward.description }}</p>
              <p class="card-text">Cost: {{ reward.cost }} Points</p>
              <button
                class="btn btn-primary"
                :disabled="userPoints < reward.cost || redeeming"
                @click="redeemReward(reward)"
              >
                Redeem
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  import { auth, db } from "../main";
  import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
  import { onAuthStateChanged } from "firebase/auth";
  import NavBar from "../components/newNavbar.vue";
  
  export default {
    components: { NavBar },
    setup() {
      const rewards = ref([]);
      const userPoints = ref(0);
      const userId = ref(null);
      const redeeming = ref(false);
  
      // Fetch available rewards from Firestore
      const fetchRewards = async () => {
        try {
          const rewardsRef = collection(db, "rewards");
          const querySnapshot = await getDocs(rewardsRef);
          rewards.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          console.error("Error fetching rewards:", error);
        }
      };
  
      // Fetch user points
      const fetchUserPoints = async (uid) => {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            userPoints.value = userDoc.data().points || 0;
          } else {
            console.error("User document does not exist.");
          }
        } catch (error) {
          console.error("Error fetching user points:", error);
        }
      };
  
      // Redeem reward function
      const redeemReward = async (reward) => {
        if (userPoints.value >= reward.cost && userId.value) {
          redeeming.value = true; // disable button during process
          try {
            const userRef = doc(db, "users", userId.value);
            
            // Update user's points
            await updateDoc(userRef, {
              points: userPoints.value - reward.cost
            });
  
            userPoints.value -= reward.cost; // Update locally after Firestore updates
            alert(`Successfully redeemed ${reward.name}!`);
          } catch (error) {
            console.error("Error redeeming reward:", error);
            alert("There was an error redeeming your reward. Please try again.");
          } finally {
            redeeming.value = false;
          }
        } else {
          alert("You do not have enough points to redeem this reward.");
        }
      };
  
      onMounted(() => {
        // Check if user is authenticated
        onAuthStateChanged(auth, (user) => {
          if (user) {
            userId.value = user.uid;
            fetchUserPoints(user.uid);
            fetchRewards();
          } else {
            console.log("User is not logged in.");
          }
        });
      });
  
      return { rewards, userPoints, redeemReward, redeeming };
    },
  };
  </script>
  
  <style scoped>
  .container {
    max-width: 800px;
    margin: auto;
  }
  .rewards-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
  .card {
    width: 100%;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  }
  </style>
