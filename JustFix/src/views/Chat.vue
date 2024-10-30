<template>
    <div v-if="username" class="container">
        <div class="card">
            <div class="row g-0">
                <div class="col-12 col-lg-5 col-xl-3 border-end">
                    <div class="p-3">
                        <input type="text" class="form-control mb-3" placeholder="Search...">
                        <ul class="list-unstyled chat-list">
                            <li v-if="contacts.length === 0" class="text-muted text-center">No recent chats</li>
                            <li v-else v-for="contact in contacts" :key="contact.otherUserId" class="chat-item"
                                @click="selectContact(contact)">
                                <img :src="contact.otherUserImageUrl" class="rounded-circle me-2" width="40"
                                    height="40">
                                <div class="chat-info">
                                    <strong>{{ contact.otherUserName }}</strong>
                                    <small class="d-block text-muted">{{ contact.status }}</small>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="col-12 col-lg-7 col-xl-9 chat-container">
                    <div class="chat-header" v-if="selectedContact">
                        <img :src="contactPic" class="rounded-circle me-2" width="40" height="40">
                        <strong>{{ contactName }}</strong>
                    </div>

                    <div class="chat-messages" ref="messagesContainer">
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
                <input v-model="newMessage" type="text" class="form-control" placeholder="Click here to type" @keyup.enter="sendMessage"/>
                <button @click="sendMessage" class="btn btn-success">
                    <i class="fa fa-paper-plane"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { db, auth, realtimeDb } from "../main"; // Ensure your Firebase setup is correctly imported
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, getDocs, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { ref as dbRef, set, onValue, push } from 'firebase/database';

const route = useRoute();
const store = useStore();
const user = ref(null);
const contacts = ref([]);
const chatHistory = ref([]);
const newMessage = ref('');
const selectedContact = ref(null);
const isRepairerStatus = ref(false); // New reactive variable to store isRepairer result
const messagesContainer = ref(null);

// Populating receiver details from route
const contactId = ref(route.query.repairerId); // Make it reactive
const contactName = ref(route.query.repairName); // Make it reactive
const contactPic = ref(route.query.repairerPic); // Make it reactive
const senderPic = sessionStorage.getItem('profilePic') || Cookies.get('profilePic');
const username = Cookies.get('username') || sessionStorage.getItem('username');
const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
console.log(contactId.value);

// Check authentication and fetch user data
onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
        user.value = currentUser;
        isRepairerStatus.value = await isRepairer(uid);
        loadContacts();
        // Load chat with repairer if provided
        if (contactId.value) {
            selectContact({ otherUserId: contactId.value });
        }
    } else {
        window.location.href = './login';
    }
});


onMounted(() => {
    // Load existing chats when user click on chat on repairer card body
    if (contactId.value != null) {
        loadChatHistory(contactId.value, uid);
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
        where('userIds', 'array-contains', uid), // Check if user ID is in the userIds array
        orderBy('lastMessageTime', 'desc')
    );

    onSnapshot(contactsQuery, async (snapshot) => {
        console.log("Raw Query Snapshot:", snapshot.docs.map(doc => doc.data()));
        contacts.value = snapshot.empty
            ? []
            : await Promise.all(snapshot.docs.map(async docs => {
                const data = docs.data();
                const otherUserId = data.userIds.find(id => id !== uid); // Get the other user ID

                // Retrieve the imageUrl for the other user
                const userDocRef = doc(db, 'users', otherUserId);
                try {
                    const userDoc = await getDoc(userDocRef);
                    const otherUserName = userDoc.exists() ? userDoc.data().name : null;
                    const otherUserImageUrl = userDoc.exists() ? userDoc.data().imageUrl : null; // Get imageUrl

                    return {
                        id: doc.id,
                        ...data,
                        otherUserName,
                        otherUserId, // Add other user ID to the contact object
                        otherUserImageUrl // Add imageUrl to the contact object
                    };
                } catch (error) {
                    console.error("Error retrieving user document:", error);
                    return {
                        id: doc.id,
                        ...data,
                        otherUserId,
                        otherUserName,
                        otherUserImageUrl: null // Fallback if user document can't be retrieved
                    };
                }
            }));
    });
};

// Load chat history with a selected contact
const loadChatHistory = async (contactId, uid) => {
    // Log the contactId to see which contact is selected

    // Load all contacts that include the current user (uid)
    const chatQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', uid), // First condition: uid is in userIds
        orderBy('timestamp', 'asc')
    );

    // Execute query
    // Use onSnapshot for real-time updates
    onSnapshot(chatQuery, (snapshot) => {
        chatHistory.value = snapshot.docs
            .filter(doc => doc.data().participants.includes(contactId))
            .map(doc => ({ id: doc.id, ...doc.data() }));
    });
};

// Select a contact to chat with
const selectContact = async (contact) => {
    selectedContact.value = contact;
    console.log(contact);

    try {
        // Query to find the contact document that includes the current user ID
        const contactsQuery = query(
            collection(db, 'contacts'),
            where('userIds', 'array-contains', [uid, contact.otherUserId]) // Check if uid is in the userIds array
        );
        const querySnapshot = await getDocs(contactsQuery);
        let receiverId = null;

        // Loop through the matching documents
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.userIds.includes(contact)) {
                // Get the other user ID in the array that is not the current user ID
                receiverId = data.userIds.find(id => id !== uid);
            }
        });

        if (contactId) {
            // If receiverId is found, load the repairer data
            const contactDocRef = doc(db, 'users', contact.otherUserId);
            const contactDoc = await getDoc(contactDocRef);

            if (contactDoc.exists()) {
                const contactData = contactDoc.data();
                contactId.value = contact.otherUserId;
                contactName.value = contactData.name; // Assuming the field is 'name'
                contactPic.value = contactData.imageUrl; // Assuming the field is 'photoURL'
                loadChatHistory(contact.otherUserId, uid); // Load chat history for the receiver
            } else {
                console.log('No such document for repairer!');
            }
        } else {
            console.log('No matching contact found.');
        }
    } catch (error) {
        console.error("Error selecting contact:", error);
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
                senderId: uid,
                receiverId: contactId.value,
                timestamp: serverTimestamp(),
                participants: [uid, contactId.value],
                photoURL: senderPic,
            });
            console.log(contactId.value);
            // Update local chatHistory to include the new message immediately
            chatHistory.value.push({
                id: chatDocRef.id,
                text: newMessage.value,
                senderId: uid,
                receiverId: contactId.value,
                timestamp: { seconds: Math.floor(Date.now() / 1000) }, // Use current time
                photoURL: senderPic,
            });

            // Check if the contact is already in the user’s recent chats
            const contactsQuery = query(
                collection(db, 'contacts'),
                where('userIds', 'array-contains', uid),
            );
            const querySnapshot = await getDocs(contactsQuery);

            if (querySnapshot.empty) {
                // If no existing contact, add new with userIds as an array
                await addDoc(collection(db, 'contacts'), {
                    userIds: [uid, contactId.value],
                    lastMessageTime: serverTimestamp(),
                });
            } else {
                // Update the lastMessageTime for the existing contact
                await updateDoc(querySnapshot.docs[0].ref, { lastMessageTime: serverTimestamp() });
            }
            // loadChatHistory(contact.otherUserId, uid);

            // Create a notification for the receiver
            console.log(contactId.value);

            const text = newMessage.value;
            newMessage.value = ''; // Clear the input after sending
            await sendNotification(contactId.value, text, username);

        } catch (error) {
            console.error("Error sending message:", error);
        }
    }

};

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

// Watch for changes in chatHistory to scroll down on new messages
watch(chatHistory, async () => {
    await nextTick(); // Ensure DOM updates before scrolling
    scrollToBottom();
});

// Create a notification for the receiver
const sendNotification = async (receiverId, message, name) => {
    const notificationRef = dbRef(realtimeDb, `notifications/${receiverId}`);
    await push(notificationRef, {
        notificationType: 'message',
        senderName: name,
        message: message,
        timestamp: new Date().toISOString(),
    });
    console.log('Notification sent to:', receiverId);
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
    max-height: calc(80vh - 220px);
    /* Adjust according to header height and input group height */
    overflow-y: auto;
    /* Enable scrolling if necessary */
    flex-grow: 1;

    /* Allow messages to fill the available space */
    @media (max-width: 992px) {
        max-height: calc(60vh - 220px);
    }
}

.chat-message-left,
.chat-message-right {
    display: flex;
    margin-bottom: 15px;
}

.chat-message-left {
    padding-left: 10px;
    padding-top: 10px;
    margin-right: auto;

    .message-content {
        background-color: #B3C7FA;
    }
}

.chat-message-right {
    flex-direction: row-reverse;
    padding-right: 10px;
    margin-left: auto;

    .message-content {
        background-color: #cdf696;
    }
}

.message-content {
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