<template>
  <div class="container py-5 mt-3" id="redeem-rewards">

    <div class="text-center my-5 points-header">
      <h2>Your Points: {{ userPoints }}</h2>
    </div>

    <div class="rewards-list row mt-5 mb-2">
      <h3 class="text-center pb-1">My Redeemable Rewards</h3>
      <div class="col-lg-4 col-md-6 col-sm-12 mb-4" v-for="reward in rewards" :key="reward.id">
        <div class="card h-100">
          <img :src="reward.imageURL" class="card-img-top" alt="Reward Image"
            style="object-fit: cover; border-radius: 15px 15px 0 0; height: 200px;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">{{ reward.name }}</h5>
            <p class="card-text">{{ reward.description }}</p>
            <p class="card-text">Cost: <strong>{{ reward.cost }} Points</strong></p>
            <button class="btn btn-success mt-auto" :disabled="userPoints < reward.cost || redeeming"
              @click="redeemReward(reward)">
              Redeem
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- My Rewards List Section -->
    <div v-if="myRewards.length" class="my-rewards-list mt-5">
      <h3 class="text-center pb-1">My Redeemed Rewards</h3>
      <div class="row">
        <div class="col-lg-4 col-md-6 col-sm-12 mb-4" v-for="myReward in myRewards" :key="myReward.id">
          <div class="card h-100" @click="showQrCode(myReward)">
            <img :src="myReward.imageURL" class="card-img-top" alt="My Reward Image"
              style="object-fit: cover; border-radius: 15px 15px 0 0; height: 200px;">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">{{ myReward.name }}</h5>
              <p class="card-text">{{ myReward.description }}</p>
              <p class="card-text">Redeemed on: {{ myReward.redeemDate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>




  </div>

  <!-- Modal for QR Code -->
  <div class="modal fade" id="qrCodeModal" tabindex="-1" aria-labelledby="qrCodeModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="qrCodeModalLabel">QR Code for Reward</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body text-center">
          <canvas id="qrCodeCanvas"></canvas>
        </div>
      </div>
    </div>
  </div>

  <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 1055;" aria-live="polite"
    aria-atomic="true">
    <div id="redeemToast" class="toast align-items-center text-white bg-success border-0" role="alert"
      aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
      <div class="d-flex">
        <div class="toast-body">
          Successfully redeemed reward!
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
          aria-label="Close"></button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { auth, db } from "../main";
import { collection, getDocs, doc, updateDoc, query, where, orderBy, Timestamp, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { merge } from "chart.js/helpers";
// import { useToast } from "vue-toastification";
import QRCode from "qrcode";

export default {
  setup() {
    const rewards = ref([]);
    const userPoints = ref(0);
    const userId = ref(null);
    const redeeming = ref(false);
    const myRewards = ref([]);
    const qrCodeCanvas = ref(null); // Reference to the QR Code canvas

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
        // const monthlyPoints = Array(12).fill(0);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // const date = parseTimestamp(data.timestamp);
          // console.log("Document ID:", doc.id, "UID:", data.UID, "Timestamp:", data.Date);
          // const date = new Date(data.Date.seconds * 1000)
          // const monthIndex = date.getMonth();
          const pointsValue = Number(data.points) || 0;
          const currentDate = new Date();

          // monthlyPoints[monthIndex] += pointsValue;
          if (data.Date.toDate() <= currentDate) {
            if (data.type == "redeem") {
              userPoints.value -= pointsValue;
            } else {
              userPoints.value += pointsValue;
              // monthlyPoints[monthIndex] += pointsValue;
            }
          }
        });

        // pointsData.value = [...monthlyPoints];
        // pointsData = pointsData.value;
        // console.log("Final monthly points distribution:", pointsData);
      }
      catch (error) {
        console.error("Error fetching points:", error);
      }
    };

    // Fetch redeemed rewards
    const fetchMyRewards = async (userId) => {
      try {
        const myRewardsRef = collection(db, "myRewards");
        const querySnapshot = await getDocs(query(myRewardsRef, where("UID", "==", userId)));
        myRewards.value = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          redeemDate: new Date(doc.data().redeemDate.seconds * 1000).toLocaleDateString()
        }));
      } catch (error) {
        console.error("Error fetching redeemed rewards:", error);
      }
    };

    // Redeem reward function
    const redeemReward = async (reward) => {
      if (userPoints.value >= reward.cost && userId.value) {
        redeeming.value = true; // disable button during process
        try {
          const userRef = doc(db, "users", userId.value);

          // Add redeemed reward to Firestore under "myRewards"
          await addDoc(collection(db, "myRewards"), {
            UID: userId.value,
            name: reward.name,
            description: reward.description,
            imageURL: reward.imageURL,
            redeemDate: Timestamp.now()
          });


          // update user's points
          await addDoc(collection(db, 'points'), {
            UID: userId.value,
            points: reward.cost,
            type: "redeem",
            Date: Timestamp.now(),
            description: 'Redeemed reward',
          });
          // Update user's points
          // await updateDoc(userRef, {
          //   points: userPoints.value - reward.cost
          // });

          userPoints.value -= reward.cost; // Update locally after Firestore updates
          myRewards.value.push({
            ...reward,
            redeemDate: new Date().toLocaleDateString()
          });
          // alert(`Successfully redeemed ${reward.name}!`);
          // Show the Bootstrap toast
          const toastElement = document.getElementById("redeemToast");
          const toast = new bootstrap.Toast(toastElement);
          toast.show();
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

    // Display QR code for selected reward
    const showQrCode = async (reward) => {
      const qrData = `Reward ID: ${reward.id}, Reward Name: ${reward.name}`;
      try {
        const canvas = document.getElementById("qrCodeCanvas");
        await QRCode.toCanvas(canvas, qrData, { width: 200 });
        const modal = new bootstrap.Modal(
          document.getElementById("qrCodeModal")
        );
        modal.show();
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    };

    onMounted(() => {
      // Check if user is authenticated
      onAuthStateChanged(auth, (user) => {
        if (user) {
          userId.value = user.uid;
          fetchUserPoints(user.uid);
          fetchRewards();
          fetchMyRewards(user.uid)
        } else {
          console.log("User is not logged in.");
        }
      });
    });

    return { rewards, userPoints, redeemReward, redeeming, myRewards, showQrCode };
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
  padding-top: 80px;
}

.points-header {
  margin-top: 30px
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
  min-height: 100%;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.card-body {
  display: flex;
  flex-direction: column;
  padding: 20px;
  justify-content: space-between;
  min-height: 250px;
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
  background-color: black;
  color: white;
}

.btn-success:disabled {
  background-color: #c8c8c8;
  color: #fff;
}
</style>