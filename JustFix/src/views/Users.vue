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
              <th>UID</th>
              <th>Account Created</th>
              <th>Last Login</th>
              <th>Status</th>
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
              <td>{{ user.status }}</td>
              <td>
                <button class="action-button" @click="viewUser(user.id)">View</button>
                <button class="action-button delete-button" @click="deleteUser(user.id)">Delete</button>
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
          this.users = this.users.filter(user => user.id !== userId);
          alert("User deleted successfully");
        } catch (error) {
          console.error("Error deleting user:", error);
        }
      },
      formatDate(timestamp) {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
      }
    }
  };
  </script>
  
  <style>
  .users-container {
    padding: 80px 20px 20px;
  }
  
  h1 {
    margin-bottom: 20px;
    font-size: 2em;
    text-align: center;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    background-color: #f9f9f9;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  th, td {
    padding: 15px;
    border: 1px solid #ddd;
    text-align: left;
  }
  
  th {
    background-color: #085C44;
    color: #fff;
    font-weight: bold;
  }
  
  td {
    background-color: #ffffff;
  }
  
  button.action-button {
    padding: 5px 10px;
    margin: 5px;
    border: none;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.9em;
  }
  
  button.action-button:hover {
    opacity: 0.9;
  }
  
  button.delete-button {
    background-color: #f76c6c;
    color: white;
  }
  
  button.delete-button:hover {
    background-color: #d9534f;
  }
  </style>
  