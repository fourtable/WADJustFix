<template>
  <div class="transaction-history">
  <h3>Transaction History</h3>
  <table class="transaction-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Type</th>
        <th>Points</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(transaction, index) in transactions" :key="index">
        <td>{{ formatDate(transaction.Date) }}</td>
        <td>{{ transaction.description || '-' }}</td>
        <td>{{ transaction.type }}</td>
        <td :class="transaction.type === 'earn' ? 'positive-points' : 'negative-points' ">
          {{ transaction.type === 'earn' ? '+' : '-' }}{{ transaction.points }}
        </td>
      </tr>
    </tbody>
  </table>
</div>

</template>

<script>
import { ref, onMounted } from 'vue';
import { db } from '../main';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../main';

export default {
  setup() {
    const transactions = ref([]);

    const fetchTransactions = async (userId) => {
      try {
        const transactionsRef = query(
          collection(db, "points"),
          where("UID", "==", userId),
          orderBy("Date", "desc")
        );
        const querySnapshot = await getDocs(transactionsRef);
        transactions.value = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          date: new Date(doc.data().Date.seconds * 1000).toLocaleDateString()
        }));
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    const formatDate = (date) => {
      const d = new Date(date.seconds * 1000); // Adjust if using Firebase Timestamp
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    onMounted(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchTransactions(user.uid);
        }
      });
    });

    return { transactions, formatDate };
  }
};
</script>

<style scoped>
.transaction-history {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.transaction-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.transaction-table th,
.transaction-table td {
  padding: 12px;
  border: 1px solid #ddd;
  text-align: left;
}

.transaction-table th {
  background-color: #085C44;
  color: white;
}

.positive-points {
  color: green;
  font-weight: bold;
}

.negative-points {
  color: red;
  font-weight: bold;
}

</style>
