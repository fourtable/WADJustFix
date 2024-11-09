<template>
    <div class="container-box py-5" id="leaderboard">
      <h2 class="text-center mb-5"> {{ currentMonthName }} Leaderboard</h2>
  
      <!-- Podium Section for Top 3 Repairers -->
      <div class="podium text-center mb-5">
        <div class="podium-place second-place" v-if="topRepairers.length > 1">
          <!-- <div class="podium-item"> -->
            <img :src="topRepairers[1].profilePicURL" alt="2nd Place" class="profile-pic podium-2" @click="navigateToProfile(topRepairers[1].UID)">
            <div class="place">2</div>
            <div class="name">{{ topRepairers[1].displayName }}</div>
            <div class="points">{{ topRepairers[1].monthlyPoints }} Points</div>
          <!-- </div> -->
        </div>
        <div class="podium-place first-place" v-if="topRepairers.length > 0">
          <!-- <div class="podium-item"> -->
            <img :src="topRepairers[0].profilePicURL" alt="1st Place" class="profile-pic podium-1" @click="navigateToProfile(topRepairers[0].UID)">
            <!-- <img src="crown.png" alt="Crown" class="crown"> -->
            <span class="crown-icon">👑</span> <!-- Add crown icon here -->
            <div class="place">1</div>
            <div class="name">{{ topRepairers[0].displayName }}</div>
            <div class="points">{{ topRepairers[0].monthlyPoints }} Points</div>
          <!-- </div> -->
        </div>
        <div class="podium-place third-place" v-if="topRepairers.length > 2">
          <!-- <div class="podium-item"> -->
            <img :src="topRepairers[2].profilePicURL" alt="3rd Place" class="profile-pic podium-3" @click="navigateToProfile(topRepairers[2].UID)">
            <div class="place">3</div>
            <div class="name">{{ topRepairers[2].displayName }}</div>
            <div class="points">{{ topRepairers[2].monthlyPoints }} Points</div>
          <!-- </div> -->
        </div>
      </div>
  
      <!-- Leaderboard Table for Remaining Top Repairers -->
      <div class="leaderboard-list">
        <div v-for="(repairer, index) in topRepairers.slice(3)" :key="repairer.UID" class="leaderboard-item">
          <div class="rank">{{ index + 4 }}</div>
          <img :src="repairer.profilePicURL" alt="Profile Picture" class="profile-pic" @click="navigateToProfile(repairer.UID)">
          <div class="name">{{ repairer.displayName }}</div>
          <div class="points">{{ repairer.monthlyPoints }} Points</div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from "vue";
  import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
  import { db } from "../main";
  import { useRouter } from "vue-router";
  
  export default {
    setup() {
      const topRepairers = ref([]);
      const router = useRouter(); 

      // Computed property to get the current month name
      const currentMonthName = computed(() => {
        const date = new Date();
        return date.toLocaleString("default", { month: "long" });
      });
  
      // Fetch monthly points and top repairers
      const fetchTopRepairers = async () => {
        try {

            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            // Get points from Firestore
            const pointsRef = collection(db, "points");
            const querySnapshot = await getDocs(query(pointsRef, where("type", "==", "earn"), orderBy("Date", "asc")));
  
            const monthlyPointsMap = {};
  
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const date = new Date(data.Date.seconds * 1000);

                // Check if the date is in the current month and year
                if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                    const userId = data.UID;
                    const pointsValue = Number(data.points) || 0;
                // const monthIndex = date.getMonth();
                // const userId = data.UID;
                // const pointsValue = Number(data.points) || 0;
  
            // Initialize user entry if not exist
                    if (!monthlyPointsMap[userId]) {
                    monthlyPointsMap[userId] = { monthlyPoints: 0, UID: userId };
                    }
                    if (data.Date.toDate() <= currentDate){
                    monthlyPointsMap[userId].monthlyPoints += pointsValue;
                    }
                }
            });
  
            // Fetch user profiles and combine data
            const usersRef = collection(db, "users");
            const userSnapshot = await getDocs(query(usersRef, where("userType", "==", "repairer")));
            const usersMap = {};
        //   const repairers = Object.values(monthlyPointsMap).map((repairer) => ({
        //     ...repairer,
        //     profilePicURL: usersMap[repairer.UID]?.imageUrl || "default-profile.png",
        //     displayName: usersMap[repairer.UID]?.name || "Unknown",
        //   }));
  
            userSnapshot.forEach((doc) => {
                usersMap[doc.id] = doc.data();
            });

        //   console.log(usersMap);
            // Map points to repairers with profile data, filtering only for repairers
            // const repairers = Object.values(monthlyPointsMap).map((repairer) => ({
            //     ...repairer,
            //     profilePicURL: usersMap[repairer.UID]?.imageUrl || "default-profile.png",
            //     displayName: usersMap[repairer.UID]?.name || "Unknown",
            // }));
            const repairers = Object.values(monthlyPointsMap)
            .filter(repairer => usersMap[repairer.UID]) // Only include repairers in usersMap
            .map(repairer => ({
                ...repairer,
                profilePicURL: usersMap[repairer.UID]?.imageUrl || "default-profile.png",
                displayName: usersMap[repairer.UID]?.name || "Unknown",
            }));
          
        //   console.log(repairers)
  
            // Sort by monthly points in descending order
            repairers.sort((a, b) => b.monthlyPoints - a.monthlyPoints);
  
            topRepairers.value = repairers;
        } catch (error) {
            console.error("Error fetching leaderboard data:", error);
        }
    };

    const navigateToProfile = (userId) => {
    console.log('Navigating to profile with ID:', userId); // Debug line
    router.push({
        name: 'viewProfile', // Make sure this matches the name of your route
        params: { id: userId } // Pass the repairman ID as a parameter
    });
};
  
    onMounted(() => {
        fetchTopRepairers();
        });
  
    return { topRepairers, navigateToProfile, currentMonthName };
    },
  };
  </script>
  
  <style scoped>
  .container-box {
    max-width: 98%;
    margin: auto;
    border: 2px solid #ddd;
    border-radius: 10px;
    padding: 20px;
    background-color: #e0e4e8;
  }
  
  .podium {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 20px;
  }

  .podium-place{
    /* text-align: center;
    position: relative; */
    position: relative;
    width: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding-top: 60px;
    padding-bottom: 20px;
    border-radius: 10px;
    color: #fff;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  /* .podium-item {
    text-align: center;
    position: relative;
  } */
  
  .first-place {
    background-color: gold;
    height: 200px;
    width: 130px;
    z-index: 3;
  }

  .second-place {
    background-color: #b0b0b0;
    height: 170px;
    width: 130px;
    z-index: 2;
    border: 2px solid #888;
  }

  .third-place {
    background-color: #cd7f32;
    height: 150px;
    width: 130px;
    z-index: 1;
  }
  
  .crown-icon {
    font-size: 30px;
    position: absolute;
    top: -70px;
    /* left: 50%;
    transform: translateX(-50%); */
  }
  
  .profile-pic {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    position: absolute;
    top: -40px;
    border: 3px solid #fff;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
  }
  
  .place {
    font-size: 1.5rem;
    font-weight: bold;
    margin-top: 20px;
  }
  
  /* .podium-2, .podium-3 {
    width: 90px;
    height: 90px;
  }
  
  .podium-place {
    margin: 0 10px;
  }
  
  .place {
    font-size: 1.5rem;
    font-weight: bold;
  } */
  
  .name {
    font-size: 1rem;
  }
  
  .points {
    color: #333;
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
  