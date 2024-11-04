<template>
  <div class="container mt-5 pt-4">
    <h1 class="text-center mb-4">All Users</h1>
    <div v-if="users.length > 0" class="table-responsive">
      <table class="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>User Type</th>
            <th>UID</th>
            <th>Account Created</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.userType }}</td>
            <td>{{ user.uid }}</td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>{{ formatDate(user.lastLogin) }}</td>
            <td>
              <button class="btn btn-primary btn-sm me-2" @click="viewUser(user.id)">View</button>
              <button class="btn btn-danger btn-sm" @click="deleteUser(user.id)">Delete</button>
            </td>
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
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export default {
  data() {
    return {
      users: [],
    };
  },
  async created() {
    await this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        this.users = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt, // Account creation date
          lastLogin: doc.data().lastLogin, // Last login date
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    },
    viewUser(userId) {
      this.$router.push({ name: "viewProfile", params: { id: userId } });
    },
    async deleteUser(userId) {
      try {
        await deleteDoc(doc(db, "users", userId));
        this.users = this.users.filter((user) => user.id !== userId);
        alert("User deleted successfully");
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    },
    formatDate(timestamp) {
      if (!timestamp) return "N/A";
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    },
  },
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
</style>
