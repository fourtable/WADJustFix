<template>
    <div class="users-container">
      <h1>All Users</h1>
      <div v-if="users.length > 0">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>User Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.userType }}</td>
              <td>
                <!-- Add actions like View, Edit, or Delete if necessary -->
                <button @click="viewUser(user.id)">View</button>
                <button @click="deleteUser(user.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
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
          }));
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      },
      viewUser(userId) {
        // Navigate to user profile page or open a modal with user details
        this.$router.push({ name: "ViewProfile", params: { id: userId } });
      },
      async deleteUser(userId) {
        try {
          await deleteDoc(doc(db, "users", userId));
          this.users = this.users.filter(user => user.id !== userId);
          alert("User deleted successfully");
        } catch (error) {
          console.error("Error deleting user:", error);
        }
      }
    }
  };
  </script>
  
  <style>
  .users-container {
    padding: 20px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 10px;
    border: 1px solid #ccc;
    text-align: left;
  }
  button {
    margin: 5px;
  }
  </style>
  