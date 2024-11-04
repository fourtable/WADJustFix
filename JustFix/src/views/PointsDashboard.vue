<template>
  <div class="container-fluid py-5" id="points">
    <div class="row" style="height: 50vh;">
      <div class="col-md-6 dashboard-section">
        <LineChart :labels="chartLabels" :data="pointsData" />
      </div>
      <div class="col-md-6 dashboard-section">
        <div class="points-box">
          <span class="trophy-icon">🏆</span>
          <p class="total-points">{{ totalPoints }}</p>
          <p>Total Points</p>
          <button class="btn btn-primary" @click="redeemPoints">Redeem Rewards</button>
        </div>
      </div>
    </div>
    <div class="row mt-3" style="height: 50vh;">

      <!-- How to Earn More Points - Card 1 -->
      <div class="col-md-3 dashboard-section">
          <div class="earn-points-card">
              <h5>Join Events</h5>
              <p>Participate in events to get 20 bonus points!</p>
              <button class="btn btn-primary" @click="joinEvents">Join Events</button>
          </div>
      </div>

      <!-- How to Earn More Points - Card 2 -->
      <div class="col-md-3 dashboard-section">
          <div class="earn-points-card">
              <h5>Earn Points Through Repairs</h5>
              <p>Complete/Request more repairs to earn  an additional 50 points!</p>
              <!-- <button class="btn btn-primary" @click="joinEvents">Join Events</button> -->
          </div>
      </div>

      <!-- How to Earn More Points - Card 3 -->
      <div class="col-md-3 dashboard-section">
          <div class="earn-points-card">
              <h5>Leave Reviews </h5>
              <p>Complete a review after every repair has been completed to earn 10 points!</p>
              <button class="btn btn-primary" @click="leaveReview">Leave Review</button>
          </div>
      </div>

      <!-- How to Earn More Points - Card 4 -->
      <!-- <div class="col-md-3 dashboard-section">
          <div class="earn-points-card">
              <h5>Earn More Points By Participating In Events (for users)</h5>
              <p>Join our events to get bonus points.</p>
          </div>
      </div> -->
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from "vue";
import { auth, db } from '../main';
import { collection, query, getDocs, doc, where, getDoc, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'vue-router'
import LineChart from "../components/linechart.vue";


export default {
  components: {
    LineChart
  },
  setup() {
    
    const router = useRouter();
    const totalPoints = ref(0);
    let pointsData = ref(Array(12).fill(0)); // Initialize with 12 months of 0 points
    const username = ref("");
    const chartLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const redeemPoints = () => {
      router.push({ name: 'redeem' }); // Navigate to the Redeem route
    };
    const joinEvents = () => {
      router.push({ name: 'event' }); // Navigate to the Event route
    };
    const leaveReview = () => {
      router.push({ name: 'myQuotes' }); // Navigate to the Event route
    };

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
          console.log("Document ID:", doc.id, "UID:", data.UID, "Timestamp:", data.Date, data.type);
          const date = new Date(data.Date.seconds * 1000)
          const monthIndex = date.getMonth();
          const pointsValue = Number(data.points) || 0;

          // monthlyPoints[monthIndex] += pointsValue;
          // totalPoints.value += pointsValue;
          if (data.type == "redeem") {
              totalPoints.value -= pointsValue;
            } else {
              totalPoints.value += pointsValue;
              monthlyPoints[monthIndex] += pointsValue;
            }
        });

        pointsData.value = [...monthlyPoints];
        pointsData = pointsData.value;
        console.log("Final monthly points distribution:", pointsData);
      }
      catch (error) {
        console.error("Error fetching points:", error);
      }
    };

    onMounted(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            // console.log(user.uid);
            if (userDoc.exists()) {
              await fetchUserPoints(user.uid);
            } else {
              console.log("User document does not exist");
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        } else {
          console.log("User is not logged in");
          pointsData.value = Array(12).fill(0);
          totalPoints.value = 0;
          username.value = "";
        }
      });
      // Cleanup subscription on component unmount
      return () => unsubscribe();
    });
    return { redeemPoints, joinEvents, leaveReview, chartLabels, totalPoints, pointsData };
  },
  methods: {
    // redeemPoints() {
    //   // alert("Redeeming points...");
    //   // this method will route user to redeem page, will need to create
    //   // router.push({ name: 'redeem' });
    //   // this.showNotification("Points redeemed", "alert")
    // },
    showNotification(message, type) {
      const notification = {
        type: type,
        message: message,
        timestamp: new Date().toISOString(),
        isVisible: true,
      };
      // console.log('Dispatching notification:', notification);
      this.$store.dispatch('addNotification', notification); // Dispatch the action to add notification
    },
  }
};
</script>


<style lang="scss" scoped>
#points {
  margin-top: 10vh;
  border-radius: 10px;
  flex:1;

  .dashboard-section {
    height: 100%;
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .row {
    display: flex;  /* Use flexbox for better responsiveness */
    flex-wrap: wrap;  /* Allow wrapping */
  }

  .line-graph-container {
    position: relative;
    height: 100%;
    padding: 20px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    flex: 1 1 400px;
  }

  .points-box {
    position: relative;
    height: 100%;
    padding: 20px;
    background-color: #fff;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center; // Centers content vertically and horizontally
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow: visible; // Allows content to overflow outside
    text-align: center; // Centers text within the box
  }

  button.btn-primary {
    width: fit-content;
    margin-top: 1rem;
  }


  .trophy-icon {
    font-size: 5rem;
    color: #ffc107;
  }

  .total-points {
    font-size: 3rem;
    font-weight: bold;
  }

  .points-actions {
    display: flex;
    justify-content: flex-end;
  }

  .earn-points-card {
    padding: 20px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    height: 100%;
  }
}
</style>
