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
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default {
    props:{
        
    },
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
                  createdAt: doc.data().createdAt,
                  lastLogin: doc.data().lastLogin,
                }));
                } 
                catch (error) {
                  console.error("Error fetching users:", error);
                }
                },
        viewUser(userId) {
          this.$router.push({ name: "viewProfile", params: { id: userId } });
        },
        async blockUser(userId) {
          try {
            await updateDoc(doc(db, "users", userId), {
              blocked: true,
            });
            this.users = this.users.map((user) =>
              user.id === userId ? { ...user, blocked: true } : user
            );
            this.showNotification("User blocked successfully", "alert");
          } catch (error) {
            console.error("Error blocking user:", error);
          }
        },
        async unblockUser(userId) {
          try {
            await updateDoc(doc(db, "users", userId), {
              blocked: false,
            });
            this.users = this.users.map((user) =>
              user.id === userId ? { ...user, blocked: false } : user
            );
            this.showNotification("User unblocked successfully", "alert");
          } catch (error) {
            console.error("Error unblocking user:", error);
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
