<template>
    <div class="container-box py-5" id="leaderboard">
      <h2 class="text-center mb-5"> {{ currentMonthName }} Leaderboard</h2>
  
      <!-- Podium Section for Top 3 Repairers -->
      <div class="podium-spacer"></div>
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
        <div v-for="(repairer, index) in topRepairers.slice(3)" :key="repairer.UID" class="leaderboard-item card" @click="navigateToProfile(repairer.UID)">
          <div class="rank">{{ index + 4 }}</div>
          <img :src="repairer.profilePicURL" alt="Profile Picture" class="list-profile-pic">
          <div class="user-info">
            <div class="user-info-name">{{ repairer.displayName }} </div>
            <div class="user-info-points">{{ repairer.monthlyPoints }} Points</div>
          </div>
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
    min-height: 100vh;
    max-width: 98%;
    margin: auto;
    border: 2px solid #ddd;
    border-radius: 10px;
    padding: 60px 20px 20px;
    background-color: #e0e4e8;
    overflow: hidden;
  }

  .podium-spacer {
  height: 2px; /* Adjust height as needed to provide enough space */
  }

  #leaderboard h2 {
    margin-bottom: 30px; /* Increase top margin */
  }
  
  .podium {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 20px;
    margin-top: 60px;
  }

  .podium-place{
    /* text-align: center;
    position: relative; */
    position: relative;
    width: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding-top: 70px;
    padding-bottom: 30px;
    border-radius: 10px;
    color: #fff;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
    border: 3px solid #888; /* Add border to all podium places */
    transition: transform 0.3s ease, box-shadow 0.3s ease; /* Add animation */
  }
  
  /* .podium-item {
    text-align: center;
    position: relative;
  } */
  
  .first-place {
    background-color: gold;
    height: 250px;
    width: 150px;
    z-index: 3;
    border: 3px solid #e6ac00;
    animation: glow 1.5s infinite alternate; /* Glowing effect for first place */
  }

  .second-place {
    background-color: #b0b0b0;
    height: 220px;
    width: 150px;
    z-index: 2;
    border: 3px solid #888;
  }

  .third-place {
    background-color: #cd7f32;
    height: 200px;
    width: 150px;
    z-index: 1;
    border: 3px solid #8b5a2b;
  }
  
  .crown-icon {
    font-size: 35px;
    position: absolute;
    top: -80px;
    /* left: 50%;
    transform: translateX(-50%); */
  }
  
  .profile-pic {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    object-fit: cover;
    position: absolute;
    top: -40px;
    border: 3px solid #fff;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
  }

  /* Bounce animation on hover for podium places */
  .podium-place:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.3);
  }

  /* Glowing effect for first place */
  @keyframes glow {
    0% {
      box-shadow: 0 0 10px rgba(255, 223, 0, 0.8), 0 0 20px rgba(255, 223, 0, 0.6);
    }
    100% {
      box-shadow: 0 0 20px rgba(255, 223, 0, 1), 0 0 30px rgba(255, 223, 0, 0.8);
    }
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
  
  .user-info-name {
    font-size: 1rem;
    margin-right: 10px;
  }
  
  .user-info-points {
    /* margin-left: 10px; */
    color: #333;
  }
  
  .leaderboard-list {
    margin-top: 30px;
    overflow-y: auto;
    max-height: 80vh;
  }
  
  .leaderboard-item.card {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 15px;
    padding: 10px;
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .leaderboard-item.card:hover {
    transform: translateY(-5px) scale(1.03); /* Slight bounce on hover */
    box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.15);
  }

  .user-info {
    display: flex;
    flex-direction: row;
    align-items: center;
    /* Adds some space between the name and points */
    /* margin-left: 15px; */
  }
  
  .rank {
    font-size: 1.5rem;
    font-weight: bold;
    margin-right: 15px;
  }

  .list-profile-pic {
  width: 50px; /* Adjust as needed */
  height: 50px; /* Adjust as needed */
  border-radius: 50%;
  object-fit: cover;
  margin-top: 10px;
  margin-right: 15px; /* Space between image and name */
  border: 2px solid #fff; /* Optional border */
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2); /* Optional shadow */
  }
  
  </style>
  