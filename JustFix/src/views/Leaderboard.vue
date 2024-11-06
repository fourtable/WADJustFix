<template>
    <div class="container py-5" id="leaderboard">
      <h2 class="text-center mb-5">Leaderboard</h2>
  
      <!-- Podium Section for Top 3 Repairers -->
      <div class="podium text-center mb-5">
        <div class="podium-place" v-if="topRepairers.length > 1">
          <div class="podium-item">
            <img :src="topRepairers[1].profilePicURL" alt="2nd Place" class="profile-pic podium-2">
            <div class="place">2</div>
            <div class="name">{{ topRepairers[1].displayName }}</div>
            <div class="points">{{ topRepairers[1].monthlyPoints }} Points</div>
          </div>
        </div>
        <div class="podium-place" v-if="topRepairers.length > 0">
          <div class="podium-item podium-winner">
            <img :src="topRepairers[0].profilePicURL" alt="1st Place" class="profile-pic podium-1">
            <!-- <img src="crown.png" alt="Crown" class="crown"> -->
            <span class="crown-icon">👑</span> <!-- Add crown icon here -->
            <div class="place">1</div>
            <div class="name">{{ topRepairers[0].displayName }}</div>
            <div class="points">{{ topRepairers[0].monthlyPoints }} Points</div>
          </div>
        </div>
        <div class="podium-place" v-if="topRepairers.length > 2">
          <div class="podium-item">
            <img :src="topRepairers[2].profilePicURL" alt="3rd Place" class="profile-pic podium-3">
            <div class="place">3</div>
            <div class="name">{{ topRepairers[2].displayName }}</div>
            <div class="points">{{ topRepairers[2].monthlyPoints }} Points</div>
          </div>
        </div>
      </div>
  
      <!-- Leaderboard Table for Remaining Top Repairers -->
      <div class="leaderboard-list">
        <div v-for="(repairer, index) in topRepairers.slice(3)" :key="repairer.UID" class="leaderboard-item">
          <div class="rank">{{ index + 4 }}</div>
          <img :src="repairer.profilePicURL" alt="Profile Picture" class="profile-pic">
          <div class="name">{{ repairer.displayName }}</div>
          <div class="points">{{ repairer.monthlyPoints }} Points</div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
  import { db } from "../main";
  
  export default {
    setup() {
      const topRepairers = ref([]);
  
      // Fetch monthly points and top repairers
      const fetchTopRepairers = async () => {
        try {
          // Get points from Firestore
          const pointsRef = collection(db, "points");
          const querySnapshot = await getDocs(query(pointsRef, where("type", "==", "earn"), orderBy("Date", "asc")));
  
          const monthlyPointsMap = {};
  
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(data.Date.seconds * 1000);
            const monthIndex = date.getMonth();
            const userId = data.UID;
            const pointsValue = Number(data.points) || 0;
  
            // Initialize user entry if not exist
            if (!monthlyPointsMap[userId]) {
              monthlyPointsMap[userId] = { monthlyPoints: 0, UID: userId };
            }
            monthlyPointsMap[userId].monthlyPoints += pointsValue;
          });
  
          // Fetch user profiles and combine data
          const usersRef = collection(db, "users");
          const userSnapshot = await getDocs(usersRef);
          const usersMap = {};
        //   const repairers = Object.values(monthlyPointsMap).map((repairer) => ({
        //     ...repairer,
        //     profilePicURL: usersMap[repairer.UID]?.imageUrl || "default-profile.png",
        //     displayName: usersMap[repairer.UID]?.name || "Unknown",
        //   }));
  
          userSnapshot.forEach((doc) => {
            usersMap[doc.id] = doc.data();
            

          });
          console.log(usersMap);
          const repairers = Object.values(monthlyPointsMap).map((repairer) => ({
            ...repairer,
            profilePicURL: usersMap[repairer.UID]?.imageUrl || "default-profile.png",
            displayName: usersMap[repairer.UID]?.name || "Unknown",
          }));
          
          console.log(repairers)
  
          // Sort by monthly points in descending order
          repairers.sort((a, b) => b.monthlyPoints - a.monthlyPoints);
  
          topRepairers.value = repairers;
        } catch (error) {
          console.error("Error fetching leaderboard data:", error);
        }
      };
  
      onMounted(() => {
        fetchTopRepairers();
      });
  
      return { topRepairers };
    },
  };
  </script>
  
  <style scoped>
  .container {
    max-width: 800px;
    margin: auto;
  }
  
  .podium {
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }
  
  .podium-item {
    text-align: center;
    position: relative;
  }
  
  .podium-winner {
    position: relative;
  }
  
  .crown-icon {
    width: 40px;
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .profile-pic {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .podium-1 {
    width: 130px;
    height: 130px;
  }
  
  .podium-2, .podium-3 {
    width: 90px;
    height: 90px;
  }
  
  .podium-place {
    margin: 0 10px;
  }
  
  .place {
    font-size: 1.5rem;
    font-weight: bold;
  }
  
  .name {
    font-size: 1.2rem;
  }
  
  .points {
    color: #555;
  }
  
  .leaderboard-list {
    margin-top: 30px;
  }
  
  .leaderboard-item {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .rank {
    font-size: 1.5rem;
    font-weight: bold;
    margin-right: 15px;
  }
  
  </style>
  