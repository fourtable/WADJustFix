<template>
    <div v-if="username" class="container">
        <div class="card">
            <div class="row g-0">
                <div class="col-12 col-lg-5 col-xl-3 border-end">
                    <div class="p-3">
                        <input type="text" class="form-control mb-3" placeholder="Search...">
                        <ul class="list-unstyled chat-list">
                            <li v-if="contacts.length === 0" class="text-muted text-center">No recent chats</li>
                            <li v-else v-for="contact in contacts" :key="contact.id" class="chat-item" @click="selectContact(contact)">
                                <img :src="contact.imageUrl" class="rounded-circle me-2" width="40" height="40">
                                <div class="chat-info">
                                    <strong>{{ contact.name }}</strong>
                                    <small class="d-block text-muted">{{ contact.status }}</small>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="col-12 col-lg-7 col-xl-9 chat-container">
                    <div class="chat-header" v-if="selectedContact && !isRepairerStatus">
                        <img :src="repairerPic" class="rounded-circle me-2" width="40" height="40">
                        <strong>{{ repairerName }}</strong>
                    </div>
                    <div class="chat-header" v-else>
                        <img :src="nonRepairerPic" class="rounded-circle me-2" width="40" height="40">
                        <strong>{{ nonRepairerName }}</strong>
                    </div>

                    <div class="chat-messages">
                        <div v-if="chatHistory.length === 0" class="text-center mt-3">
                            <em>No messages yet. Start the conversation!</em>
                        </div>
                        <div v-else>
                            <div v-for="message in chatHistory" :key="message.id"
                                :class="{ 'chat-message-right': message.senderId === user.uid, 'chat-message-left': message.senderId !== user.uid }">
                                <div>
                                    <img :src="message.photoURL" width="40" height="40" class="rounded-circle">
                                    <div class="message-content">{{ message.text }}</div>
                                    <small class="text-muted">{{ formatTimestamp(message.timestamp) }}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="input-group">
                <input v-model="newMessage" type="text" class="form-control" placeholder="Enter text here..." />
                <button @click="sendMessage" class="btn btn-success">
                    <i class="fa fa-paper-plane"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { db, auth } from "../main"; // Ensure your Firebase setup is correctly imported
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, getDocs, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';

const route = useRoute();
const user = ref(null);
const contacts = ref([]);
const chatHistory = ref([]);
const newMessage = ref('');
const selectedContact = ref(null);
const isRepairerStatus = ref(false); // New reactive variable to store isRepairer result

// Populating receiver details from route
const repairerId = ref(route.query.repairerId); // Make it reactive
const repairerName = ref(route.query.repairName); // Make it reactive
const repairerPic = ref(route.query.repairerPic); // Make it reactive
const senderPic = sessionStorage.getItem('profilePic') || Cookies.get('profilePic');
const username = Cookies.get('username') || sessionStorage.getItem('username');
const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
const nonRepairerName = ref(null);
const nonRepairerPic = ref(null);

// Check authentication and fetch user data
onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
        user.value = currentUser;
        isRepairerStatus.value = await isRepairer(user.value.uid);
        loadContacts();
        // Load chat with repairer if provided
        if (repairerId.value) {
            selectContact({ repairerId: repairerId.value });
        }
    } else {
        window.location.href = './login';
    }
});

const isRepairer = async (userId) => {
    try {
        // Reference to the specific user's document
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().userType === "repairer") {
            return true;
        } 
        return false;
    } catch (error) {
        console.error('Error fetching userType:', error);
        return null;
    }
};

// Load contacts the user has recently chatted with
const loadContacts = () => {
    const contactsQuery = query(
        collection(db, 'contacts'), 
        where(isRepairerStatus.value ? 'repairerId' : 'userId', '==', user.value.uid), 
        orderBy('lastMessageTime', 'desc')
    );
    onSnapshot(contactsQuery, (snapshot) => {
        contacts.value = snapshot.empty ? [] : snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    });
};

// Load chat history with a selected contact
const loadChatHistory = async (contactId) => {
    // Log the contactId to see which contact is selected
    console.log(contactId);
    
    let chatQuery;

    // Check if the logged-in user is a repairer
    if (isRepairerStatus.value) {
        // Load all users that this repairer has chatted with
        chatQuery = query(
            collection(db, 'chats'), 
            where('participants', 'array-contains', user.value.uid), // Check if the repairer is one of the participants
            orderBy('timestamp')
        );
    } else {
        // Load all repairers that this user has chatted with
        chatQuery = query(
            collection(db, 'chats'), 
            where('participants', 'array-contains', contactId), // Use the contactId to filter by the selected repairer
            orderBy('timestamp')
        );
    }

    // Listen for real-time updates to the chat messages
    onSnapshot(chatQuery, async (snapshot) => {
        chatHistory.value = snapshot.empty ? [] : snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load profiles for all participants in the chat
        await loadParticipantsProfiles(snapshot.docs);
    });
};

// Function to load profiles of all chat participants
const loadParticipantsProfiles = async (chatDocs) => {
    const userIds = new Set();
    
    // Collect unique user IDs from the chat documents
    chatDocs.forEach(doc => {
        const data = doc.data();
        if (data.participants) {
            data.participants.forEach(uid => userIds.add(uid));
        }
    });

    // Fetch user profiles from the database
    const userProfiles = await Promise.all(Array.from(userIds).map(async (uid) => {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
    }));

    // Filter out any null results
    const validProfiles = userProfiles.filter(profile => profile);

    // You can now store these profiles or update your UI accordingly
    console.log('Loaded user profiles:', validProfiles);
};

// Select a contact to chat with
const selectContact = async (contact) => {
    selectedContact.value = contact;

    // If selected contact has repairerId, fetch repairer details
    if (contact.repairerId && !isRepairerStatus) {
        const repairerDocRef = doc(db, 'users', contact.repairerId);
        const repairerDoc = await getDoc(repairerDocRef);
        console.log(contact.userId);
        if (repairerDoc.exists()) {
            const repairerData = repairerDoc.data();
            repairerName.value = repairerData.name; // Assuming the field is 'name'
            repairerPic.value = repairerData.imageUrl; // Assuming the field is 'photoURL'
        } else {
            console.log('No such document for repairer!');
        }
        loadChatHistory(contact.repairerId);
    } else {
        // Load chat history based on contact ID
        const nonRepairerDocRef = doc(db, 'users', contact.userId);
        const nonRepairerDoc = await getDoc(nonRepairerDocRef);
        console.log(contact.userId);
        if (nonRepairerDoc.exists()) {
            const nonRepairerData = nonRepairerDoc.data();
            nonRepairerName.value = nonRepairerData.name; // Assuming the field is 'name'
            nonRepairerPic.value = nonRepairerData.imageUrl; // Assuming the field is 'photoURL'
        } else {
            console.log('No such document for repairer!');
        }
        loadChatHistory(contact.userId);
    }
};

// Format timestamp for display
const formatTimestamp = (timestamp) => {
    return timestamp ? new Date(timestamp.seconds * 1000).toLocaleString() : '';
};

// Send a message
const sendMessage = async () => {
    if (newMessage.value.trim()) {
        try {
            const chatDocRef = await addDoc(collection(db, 'chats'), {
                text: newMessage.value,
                senderId: user.value.uid,
                receiverId: selectedContact.value.id,
                timestamp: serverTimestamp(),
                participants: [user.value.uid, selectedContact.value.id],
                photoURL: senderPic,
            });

            // Check if the contact is already in the user’s recent chats
            const contactsQuery = query(
                collection(db, 'contacts'), 
                where('userId', '==', user.value.uid), 
                where('repairerId', '==', repairerId.value)
            );
            const querySnapshot = await getDocs(contactsQuery);
            
            if (querySnapshot.empty) {
                await addDoc(collection(db, 'contacts'), {
                    userId: user.value.uid,
                    repairerId: repairerId.value,
                    lastMessageTime: serverTimestamp(),
                    name: repairerName.value,
                    imageUrl: repairerPic.value,
                });
            } else {
                await updateDoc(querySnapshot.docs[0].ref, { lastMessageTime: serverTimestamp() });
            }

            // Create a notification for the receiver
            await addDoc(collection(db, 'notifications'), {
                receiverId: selectedContact.value.id,
                message: `You have a new message from ${username}`,
                timestamp: serverTimestamp(),
                chatId: chatDocRef.id,
            });

            newMessage.value = ''; // Clear the input after sending
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }
};
</script>
<style lang="scss" scoped>
.container {
    padding-top: 4%;

    @media (max-width: 1140px) {
        padding-top: 7%;
    }

    @media (max-width: 900px) {
        padding-top: 10%;
    }

    @media (max-width: 700px) {
        padding-top: 13%;
    }
}

.card {
    min-height: 80vh;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);

    .row {
        height: 100vh;
    }
}

.chat-list {
    max-height: 70vh;
    overflow-y: auto;
}

.chat-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background-color 0.2s;
}

.chat-item:hover {
    background-color: #f1f1f1;
}

.chat-info {
    flex-grow: 1;
}

.chat-container {
    display: flex;
    flex-direction: column;
    /* Stack children vertically */
    height: 100%;
    /* Full height to fill the parent */
}

.chat-header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #ddd;
    flex-shrink: 0;
    /* Prevent the header from shrinking */
    padding: 4%;
}

.chat-messages {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 220px);
    /* Adjust according to header height and input group height */
    overflow-y: auto;
    /* Enable scrolling if necessary */
    flex-grow: 1;
    /* Allow messages to fill the available space */
}

.chat-message-left,
.chat-message-right {
    display: flex;
    flex-shrink: 0;
    margin-bottom: 15px;
}

.chat-message-left {
    margin-right: auto;
}

.chat-message-right {
    flex-direction: row-reverse;
    margin-left: auto;
}

.message-content {
    background-color: #f8f9fa;
    padding: 10px;
    border-radius: 10px;
    margin-left: 10px;
}

.input-group {
    display: flex;
    /* Enable flexbox for the input group */
    padding: 0.5rem;
    /* Add some padding */
    border-top: 1px solid #ddd;
    /* Optional border for distinction */

    input {
        flex: 1;
        /* Allow input to grow and take available space */
        margin-right: 0.5rem;
        /* Space between input and button */
        min-width: 0;
        /* Prevent input from overflowing */
        border-radius: 10px !important;
    }

    .btn-success {
        flex-shrink: 0;
        /* Prevent button from shrinking */
        border-radius: 50% !important;
    }
}
</style>