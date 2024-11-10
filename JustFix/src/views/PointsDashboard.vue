<template>
  <div class="container-fluid py-5" id="points">
    <!-- Line Chart and Points Box Side by Side on Larger Screens -->
    <div class="row align-items-start mb-3" style="height: auto;">
      <!-- Line Chart Section -->
      <div class="col-lg-6 col-md-6 col-sm-12 col-12 dashboard-section">
        <div class="line-graph-container">
          <LineChart :labels="chartLabels" :data="pointsData" />
        </div>
      </div>

      <!-- Points Box Section -->
      <div class="col-lg-6 col-md-6 col-sm-12 col-12 dashboard-section">
        <div class="points-box text-center">
          <span class="trophy-icon">🏆</span>
          <p class="total-points">{{ totalPoints }}</p>
          <p>Total Points</p>
          <div class="button-container">
            <button class="btn" @click="redeemPoints">Redeem Rewards</button>
            <button class="btn" @click="viewTransactionLog">View Points History</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cards for Earning Points -->
    <div class="row mt-3" style="height: auto;">
      <!-- How to Earn More Points - Card 1 -->
      <div class="col-lg-4 col-md-4 col-sm-6 col-12 mb-4 dashboard-section">
        <div class="earn-points-card h-100 d-flex flex-column">
          <h5>Join Events</h5>
          <p>Participate in events to get 5 bonus points!</p>
          <div class="card-footer mt-auto">
            <button class="btn btn-primary w-100" @click="joinEvents">Join Events</button>
          </div>
        </div>
      </div>

      <!-- How to Earn More Points - Card 2 -->
      <div class="col-lg-4 col-md-4 col-sm-6 col-12 mb-4 dashboard-section">
        <div class="earn-points-card h-100 d-flex flex-column">
          <h5>Earn Points Through Repairs</h5>
          <p>Complete/Request more repairs to earn an additional 10 points!</p>
          <div class="card-footer mt-auto">
            <button class="btn btn-primary w-100" @click="sendRequest">Send Request</button>
          </div>
        </div>
      </div>

      <!-- How to Earn More Points - Card 3 -->
      <div class="col-lg-4 col-md-4 col-sm-6 col-12 mb-4 dashboard-section">
        <div class="earn-points-card h-100 d-flex flex-column">
          <h5>Leave Reviews</h5>
          <p>Complete a review after every repair has been completed to earn 10 points!</p>
          <div class="card-footer mt-auto">
            <button class="btn btn-primary w-100" @click="leaveReview">Leave Review</button>
          </div>
        </div>
      </div>
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
    
    const viewTransactionLog = () => {
    router.push({ name: 'transactionLog' }); // Replace with the route name for the transaction log page
    };
    const redeemPoints = () => {
      router.push({ name: 'redeem' }); // Navigate to the Redeem route
    };
    const joinEvents = () => {
      router.push({ name: 'event' }); // Navigate to the Event route
    };
    const leaveReview = () => {
      router.push({ name: 'myQuotes' }); // Navigate to the Event route
    };
    const sendRequest = () => {
      router.push({ name: 'home', hash: '#fixer' }); // Navigate to the Event route
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
          const currentDate = new Date();
          const date = new Date(data.Date.seconds * 1000)
          const monthIndex = date.getMonth();
          const pointsValue = Number(data.points) || 0;

          // monthlyPoints[monthIndex] += pointsValue;
          // totalPoints.value += pointsValue;
          if (data.Date.toDate() <= currentDate) {
            if (data.type == "redeem") {
              totalPoints.value -= pointsValue;
            } else {
              totalPoints.value += pointsValue;
              monthlyPoints[monthIndex] += pointsValue;
            }
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
    return { redeemPoints, joinEvents, leaveReview, sendRequest, chartLabels, totalPoints, pointsData, viewTransactionLog };
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
  margin-top: 5vh;
  border-radius: 10px;
  flex: 1;
  min-height: 92vh;
  /* Ensures the container fills most of the viewport height */
  background-color: #085C44;
  padding: 20px;
  /* Adjust padding as needed to keep internal spacing */
}

.dashboard-section {
  height: 100%;
  // height: auto;
  margin-top: 10px;
  margin-bottom: 10px;
}

.row {
  display: flex;
  /* Use flexbox for better responsiveness */
  flex-wrap: wrap;
  /* Allow wrapping */
  // align-items: stretch
}

.line-graph-container {
  // position: relative;
  max-height: 342px;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  flex: 1 1 400px;
}

.points-box {
  // position: relative;
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; // Centers content vertically and horizontally
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  // margin-top: 1rem;
  max-height: 342px;
  text-align: center; // Centers text within the box
}

.button-container {
  display: flex;
  flex-direction: row;
  gap: 10px; /* Adjust spacing between buttons */
  justify-content: center; /* Center buttons within the container */
  margin-top: 1rem;
  width: 100%;
}

.btn {
  // width: fit-content;
  // margin-top: 1rem;
  flex: 1;
  padding: 10px 0;
  color: white;
  background-color: black;
  text-align: center;
}

.btn:hover {
  background-color: #085C44;
  color: white;
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
  // display: flex;
  // flex-direction: column;
  justify-content: space-between;
  min-height: 240px;
  // max-height: 200px;
}

.card-footer {
  display: flex;
  justify-content: flex-start;
  margin-top: auto;
  // margin-bottom: 10px
}

// @media (max-width: 768px) {
//   /* Stack vertically on mobile screens and limit height */
//   .row {
//     flex-direction: column-reverse;
//   }

//   .dashboard-section {
//     height: auto;
//   }

//   .line-graph-container, 
//   .points-box {
//     max-height: 300px; /* Limit graph and points box height on small screens */
//     overflow-y: auto;  /* Allow scrolling if content overflows */
//     width: 100%;
//     flex: none
//   }
//   .earn-points-card{
//     // flex: 1;
//     // height: 100%;
//     flex-basis: auto;
//   }
// }</style>
