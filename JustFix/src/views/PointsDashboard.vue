<template>
  <div class="container py-5" id="points">
    <NavBar/>
    
    <div class="row" style="height: 50vh;">
      <div class="col-md-6 dashboard-section">
        <div class="line-graph-container">
          <LineChart :labels="chartLabels" :data="monthlyPoints" />
        </div>
      </div>
      <div class="col-md-6 dashboard-section">
        <div class="points-box">
          <div class="text-center">
            <span class="trophy-icon">🏆</span>
            <p class="total-points">{{ totalPoints }}</p>
            <p>Total Points</p>
            <p></p>
          </div>
          <button class="btn btn-primary" @click="redeemPoints">Redeem Points</button>
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
import LineChart from "../components/linechart.vue";


export default {
  setup() {

    const totalPoints = ref(0);
    const pointsData = ref(Array(12).fill(0)); // Initialize with 12 months of 0 points
    const username = ref("");
    const logo = "../assets/images/newlogo.png";
    const person = "../assets/images/person.svg";
    const chartLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
    const parseTimestamp = (timestamp) => {
    // Handle different timestamp formats
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    } else if (timestamp && timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      // Parse the string format "DD Month YYYY at HH:mm:ss UTC+8"
      return new Date(timestamp);
    }
    console.error("Invalid timestamp format:", timestamp);
    return new Date(); // fallback to current date
  };


  const fetchUserPoints = async (userId) => {
  try {
    console.log("Fetching points for user:", userId);

    const pointsRef = collection(db, "points");

    // Step 1: Test without `where` filter
    const q = query(pointsRef); // Remove filters for debugging
    
    const querySnapshot = await getDocs(q);
    
    // Debug: Log the number of documents

    // Step 2: Check if uid fields match
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("Document ID:", doc.id, "UID:", data.UID, "Timestamp:", data.Date);
    });

    // Step 3: Apply the filter back if documents are found
    if (querySnapshot.size > 0) {
      // Redo the query with filters
      const filteredQuery = query(
        pointsRef,
        where("UID", "==", userId),
        orderBy("timestamp", "asc")
      );

      const filteredSnapshot = await getDocs(filteredQuery);

      console.log("Number of points documents after applying filter:", filteredSnapshot.size);

      // Process the filtered results as before
      const monthlyPoints = Array(12).fill(0);
      let total = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // const date = parseTimestamp(data.timestamp);
        const date = new Date(data.Date.seconds * 1000)
        const monthIndex = date.getMonth();
        const pointsValue = Number(data.points) || 0;

        monthlyPoints[monthIndex] += pointsValue;
        total += pointsValue;
      });

      pointsData.value = [...monthlyPoints];
      totalPoints.value = total;
      console.log("Final monthly points distribution:", monthlyPoints);
    } else {
      console.log("No documents found after filtering.");
    }
  } catch (error) {
    console.error("Error fetching points:", error);
  }
};

  onMounted(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User authenticated:", user.uid);
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          console.log(user.uid);
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

  const redeemPoints = () => {
    alert("Redeeming points...");
  };

    // Draft 1

    // onMounted(() => {
    //   onAuthStateChanged(auth, async (user) => {
    //     if (user) {
    //       // this.userID = user.uid;
    //       // console.log("User ID:", this.userId);
    //       const userDoc = await getDoc(doc(db, "users", user.uid));
    //       if (userDoc.exists()) {
    //         // Retrieve monthly points from Firestore
    //         const pointsRef = collection(db, "points");
    //         const q = query(pointsRef, where("uid", "==", user.uid));
    //         const querySnapshot = await getDocs(q);

    //         // Initialize monthly points
    //         const monthlyPoints = Array(12).fill(0);

    //         // Process each document to accumulate points per month
    //         querySnapshot.forEach((doc) => {
    //           const data = doc.data();
    //           const date = new Date(data.timestamp.seconds * 1000); // Convert Firestore timestamp to JS Date
    //           const monthIndex = date.getMonth(); // Get month as a 0-11 index

    //           // Accumulate points for each month
    //           monthlyPoints[monthIndex] += data.points;
    //         });
    //         // Update points data and total points for display
    //         pointsData.value = monthlyPoints;
    //         totalPoints.value = monthlyPoints.reduce((acc, points) => acc + points, 0);

    //         console.log(monthlyPoints, user.uid)
    //       }
    //     } else {
    //       console.log("User is not logged in");
    //     }
    //   });
    // });

    return { totalPoints, pointsData, username, logo, person, chartLabels, redeemPoints };
  },
  // methods: {
  //   redeemPoints() {
  //     alert("Redeeming points...");
  //   }
  // }
};
</script>


<!-- commit dump 
for index.js

import PointsDashboard from "../views/PointsDashboard.vue";

{
path: '/points',
name: 'points',
component: PointsDashboard
},  


for index.html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

for style.scss

#points{
  body {
      background-color: #f4f7f6;
  }

  .dashboard-section {
      height: 100%;
  }

  .line-graph-container {
      position: relative;
      height: 100%;
      padding: 20px;
      background-color: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .points-box {
      position: relative;
      height: 100%;
      padding: 20px;
      background-color: #fff;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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




-->