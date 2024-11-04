<template>
    <div class="container py-5" id="redeem-rewards">
  
      <div class="text-center mb-5">
        <h2>Your Points: {{ userPoints }}</h2>
      </div>
  
      <div class="rewards-list row">
        <div class="col-lg-4 col-md-6 col-sm-12 mb-4" v-for="reward in rewards" :key="reward.id">
          <div class="card h-120">
            <img :src="reward.imageURL" class="card-img-top" alt="Reward Image" 
            style="object-fit: cover; border-radius: 15px 15px 0 0;">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">{{ reward.name }}</h5>
              <p class="card-text">{{ reward.description }}</p>
              <p class="card-text">Cost: <strong>{{ reward.cost }} Points</strong></p>
              <button
                class="btn btn-success mt-auto"
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
  import { collection, getDocs, doc, updateDoc, query, where, orderBy} from "firebase/firestore";
  import { onAuthStateChanged } from "firebase/auth";
  
  export default {
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
      const fetchUserPoints = async (userId) => {
        try {
          const pointsRef = query(
            collection(db, "points"),
            where("UID", "==", userId),
            orderBy("Date", "asc"));

          // Step 1: Test without `where` filter
          const q = query(pointsRef); // Remove filters for debugging

          const querySnapshot = await getDocs(q);

          // Process the filtered results as before
          const monthlyPoints = Array(12).fill(0);

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            // const date = parseTimestamp(data.timestamp);
            // console.log("Document ID:", doc.id, "UID:", data.UID, "Timestamp:", data.Date);
            const date = new Date(data.Date.seconds * 1000)
            const monthIndex = date.getMonth();
            const pointsValue = Number(data.points) || 0;

            monthlyPoints[monthIndex] += pointsValue;
            userPoints.value += pointsValue;
          });

          // pointsData.value = [...monthlyPoints];
          // pointsData = pointsData.value;
          // console.log("Final monthly points distribution:", pointsData);
        }
        catch (error) {
          console.error("Error fetching points:", error);
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
  
  <!-- <style scoped>
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
    height: 500px;
  }
  </style> -->

  <style scoped>
.container {
  max-width: 900px;
  margin: auto;
}

.rewards-list {
  display: flex;
  flex-wrap: wrap;
}

.card {
  border: none;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  height: 100%;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.card-body {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.card-title {
  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
}

.card-text {
  font-size: 1rem;
  color: #666;
  margin: 10px 0;
}

.btn-success {
  background-color: #28a745;
  color: white;
}

.btn-success:disabled {
  background-color: #c8c8c8;
  color: #fff;
}
</style>