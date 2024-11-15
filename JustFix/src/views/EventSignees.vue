<template>
  <div class="container mt-5 pt-4">
    <h1 class="text-center mb-4 mt-5">Sign Up List</h1>
    <!-- Loading Spinner -->
    <div v-if="isLoading" class="text-center">
      <p>Loading users...</p>
    </div>
    <div v-else class="event">
      <h4 class="event-title text-center">{{ event.title }} - {{ formatDate(event.eventDate) }}</h4>
      <p class="event-description mt-3" style="text-align: center;">Total Sign Ups: {{ event.totalSlots -
        event.vacantSlots }}
      </p>
    </div>

    <div v-if="users.length > 0" class="table-responsive">
      
      <table class="table table-success table-hover table-striped table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>User Type</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.userType }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="text-center">
      <p>No users found.</p>
    </div>
  </div>
</template>

<script>
import { db } from "../main";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

export default {
  data() {
    return {
      users: [],
      isLoading: true, // Loading state
      event: [],
    };
  },
  computed: {
    eventId() {
      return this.$route.query.eventId;
    }
  },
  async created() {
    await this.fetchUsers();
    await this.fetchEvent();
  },
  methods: {
    async fetchEvent() {
      const eventDocRef = doc(db, "events", this.eventId); // Use 'doc' here
      const eventDoc = await getDoc(eventDocRef); // Use 'getDoc' for single document
      this.event = eventDoc.exists() ? eventDoc.data() : null;
      console.log(this.event);
    },
    async fetchUsers() {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef);
        const snapshot = await getDocs(q);

        console.log(this.eventId);
        const filteredUsers = snapshot.docs.filter((doc) => {
          const user = doc.data();
          // Check if signedUpEvents is defined and is an array, then filter based on eventId
          return Array.isArray(user.signedUpEvents) &&
            user.signedUpEvents.some(event => event.eventId === this.eventId);
        });

        // Map the filtered users to include their document ID
        this.users = filteredUsers.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log(this.users); // Log the users for debugging
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        // Set isLoading to false once the data is loaded (or error occurs)
        this.isLoading = false;
      }
    },
    formatDate(timestamp) {
      if (!timestamp) return "N/A";
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    },
    showNotification(message, type) {
      const notification = {
        type: type,
        message: message,
        timestamp: new Date().toISOString(),
        isVisible: true,
      };
      this.$store.dispatch('addNotification', notification);
    }
  }
};
</script>

<style scoped>
.container {
  padding: 20px;
}

h1 {
  font-size: 2em;
}

.table {
  background-color: #f9f9f9;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

th {
  background-color: #085C44;
  color: #fff;
  font-weight: bold;
  text-align: center;
}

td {
  text-align: center;
}

button {
  font-size: 0.9em;
}

.event {
  font-size: 30px;
}

.event-description {
  border: #085C44 2px solid;
  padding: 2px;
  border-radius: 10px;
  padding-right: 4px;
  width: 300px;
}
</style>
