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
                                    <span class="unreadCount" v-if="contact.unreadCount > 0"> {{ contact.unreadCount
                                        }}</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="col-12 col-lg-7 col-xl-9 chat-container">
                    <div class="chat-header" v-if="selectedContact">
                        <img :src="contactPic" class="rounded-circle me-2" width="40" height="40">
                        <div>
                            <strong>{{ contactName }}</strong>
                            <div class="status-container">
                                <!-- Status circle and status text -->
                                <span id="userStatusColor"></span>
                                <p id="userStatus" class="status-text"></p>
                            </div>
                        </div>
                    </div>
                    <div class="chat-messages" ref="messagesContainer">
                        <div v-if="chatHistory.length === 0" class="text-center mt-3">
                            <em>No messages yet. Start the conversation!</em>
                        </div>
                        <div v-else>
                            <div v-for="message in chatHistory" :key="message.id"
                                :class="{ 'chat-message-right': message.senderId === uid, 'chat-message-left': message.senderId !== uid }">
                                <img :src="message.photoURL" width="40" height="40" class="rounded-circle">

                                <div v-if="message.quoteData" @click="openQuoteDetails(message.quoteData, message.id)">
                                    <div class="card quote-card my-2">
                                        <div class="card-header">
                                            {{ message.quoteData.item }}
                                        </div>

                                        <div class="card-body p-2">
                                            <img :src="message.quoteData.picture" class="card-img-top" alt="Quote Image"
                                                style="max-height: 150px; object-fit: cover; width: 100%;">
                                        </div>
                                    </div>
                                    <div class="message-content text-center">{{ message.text }}</div>
                                    <small class="text-muted d-block text-end">{{ formatTimestamp(message.timestamp)
                                        }}</small>
                                </div>

                                <div v-else>
                                    <div class="message-content">{{ message.text }}</div>
                                    <small class="text-muted">{{ formatTimestamp(message.timestamp) }}</small>
                                </div>
                            </div>

                            <!-- Quote Details Modal (Moved Outside the Loop) -->
                            <div class="modal fade" id="quoteDetailsModal" tabindex="-1"
                                aria-labelledby="quoteDetailsModalLabel" aria-hidden="true" v-if="isModalOpen">
                                <div class="modal-dialog">
                                    <div class="modal-content">
                                        <div class="modal-header">
                                            <h5 class="modal-title" id="quoteDetailsModalLabel">{{ selectedQuote.item }}
                                            </h5>
                                            <button type="button" class="btn-close" @click="closeQuoteDetails"></button>
                                        </div>
                                        <div class="modal-body">
                                            <img :src="selectedQuote.picture" class="img-fluid mb-3"
                                                alt="Quote Image" />
                                            <p><strong>Category:</strong> {{ selectedQuote.category }}</p>
                                            <p><strong>Description:</strong> {{ selectedQuote.description }}</p>
                                        </div>
                                        <div class="modal-footer">
                                            <button type="button" class="btn btn-success"
                                                @click="acceptQuote">Accept</button>
                                            <button type="button" class="btn btn-danger"
                                                @click="rejectQuote">Reject</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="input-group">
                <input v-model="newMessage" type="text" class="form-control" placeholder="Click here to type"
                    @keyup.enter="sendMessage" />
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
import { doc, getDoc, collection, query, getDocs, where, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { ref as dbRef, get, query as dbquery, set, onValue, update, push, remove } from 'firebase/database';

const route = useRoute();
const store = useStore();
const user = ref(null);
const contacts = ref([]);
const chatHistory = ref([]);
const newMessage = ref('');
const selectedContact = ref(null);
const messagesContainer = ref(null);

// Populating receiver details from route
const contactId = ref(route.query.repairerId); // Make it reactive
const contactName = ref(route.query.repairName); // Make it reactive
const contactPic = ref(route.query.repairerPic); // Make it reactive
const contactState = ref();
const senderPic = sessionStorage.getItem('profilePic') || Cookies.get('profilePic');
const username = Cookies.get('username') || sessionStorage.getItem('username');
const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
const isModalOpen = ref(false);
const selectedQuote = ref({});
const messageId = ref();

function listenForUserStatus(userId, callback) {
    const statusRef = dbRef(realtimeDb, `status/${userId}`);

    onValue(statusRef, (snapshot) => {
        const status = snapshot.val();
        if (status) {
            // Execute a callback to update the UI with the new status
            callback(status.state, status.lastChanged);
        } else {
            // Handle case where status might not exist (e.g., new user or no data)
            callback('offline', null);
        }
    }, (error) => {
        console.error("Error reading user status:", error);
    });
}

function updateUserStatusUI(state, lastChanged) {
    const statusElement = document.getElementById("userStatus");
    statusElement.textContent = capitalizeWords(state);
    const statusColorElem = document.getElementById('userStatusColor');
    if(state == 'online'){
        statusColorElem.className = 'status-indicator online';
    }
    else{
        statusColorElem.className = 'status-indicator offline';
    }
}

function openQuoteDetails(quoteData, msgId) {
    selectedQuote.value = quoteData;
    isModalOpen.value = true;
    messageId.value = msgId;

    // Wait for the next tick to ensure the modal is rendered
    nextTick(() => {
        const modalInstance = new bootstrap.Modal(document.getElementById('quoteDetailsModal'));
        modalInstance.show();
    });
}

function closeQuoteDetails() {
    selectedQuote.value = {};
    isModalOpen.value = false;
    messageId.value = '';

    // Hide Bootstrap modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('quoteDetailsModal'));
    modal.hide();

}

async function acceptQuote() {
    // Logic for accepting the quote
    try {
        // Update the quote in Firestore
        const quoteDocRef = doc(db, 'quotes', selectedQuote.value.id); // Assuming selectedQuote.value.id is the document ID

        await updateDoc(quoteDocRef, {
            repairerId: uid, // Update repairerId with the current user's ID
            repairerName: username,
            status: 'In Progress',
        });

        console.log("Quote accepted and updated in Firestore:", selectedQuote.value);

        // Optionally, you can close the modal after acceptance
        await sendNotification(selectedQuote.value.userId, "Quote accepted", username);
    } catch (error) {
        console.error("Error updating quote:", error);
    }
    // You may want to save this state to your database or perform any other actions
    // console.log("Quote accepted", selectedQuote);
    closeQuoteDetails(); // Optionally close the modal after accepting
}

async function rejectQuote() {
    // Logic for rejecting the quote
    // console.log(messageId.value);
    // closeQuoteDetails();
    try {
        // const messageDocRef = doc(db, 'chats', messageId.value);
        // Delete the message
        this.newMessage.value = "Quote Rejected";
        sendMessage();
        console.log("Quote rejected:", messageId.value);
        await sendNotification(selectedQuote.value.userId, "Quote rejected", username);
        closeQuoteDetails();
        // await deleteDoc(messageDocRef);
    } catch (error) {
        console.error("Error deleting message:", error);
    }
    // closeQuoteDetails(); // Optionally close the modal after rejecting
}

function capitalizeWords(item) {
    return item
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Check authentication and fetch user data
onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
        user.value = currentUser;
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

// Load contacts the user has recently chatted with
const fetchUnreadMessagesCount = async (userId, otherUserId) => {
    const notificationsRef = dbRef(realtimeDb, `notifications/${otherUserId}`); // Notifications for the other user
    const unreadCount = ref(0);

    // Count unread messages where the sender is the current user and read is false
    onValue(notificationsRef, (snapshot) => {
        unreadCount.value = 0; // Reset unread count

        if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
                const notificationData = childSnapshot.val();
                if (notificationData.senderId === userId && notificationData.read === false) {
                    unreadCount.value++;
                }
            });
        }
    });

    return unreadCount; // Return the reactive unread count reference
};

// Modify loadContacts to show unread message count on the receiver's side
const loadContacts = () => {
    const contactsQuery = query(
        collection(db, 'contacts'),
        where('userIds', 'array-contains', uid), // Current user's ID
        orderBy('lastMessageTime', 'desc')
    );

    onSnapshot(contactsQuery, async (snapshot) => {
        console.log("Raw Query Snapshot:", snapshot.docs.map(doc => doc.data()));
        contacts.value = snapshot.empty
            ? []
            : await Promise.all(snapshot.docs.map(async (docs) => {
                const data = docs.data();
                const otherUserId = data.userIds.find(id => id !== uid); // Get the other user ID

                // Retrieve the imageUrl for the other user
                const userDocRef = doc(db, 'users', otherUserId);
                let otherUserName = null;
                let otherUserImageUrl = null;

                try {
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        otherUserName = userDoc.data().name;
                        otherUserImageUrl = userDoc.data().imageUrl;
                    }
                } catch (error) {
                    console.error("Error retrieving user document:", error);
                }

                // Fetch the unread messages count for the other user (receiver)
                const unreadCount = await fetchUnreadMessagesCount(otherUserId, uid); // Fetch unread count for the receiver
                return {
                    id: doc.id,
                    ...data,
                    otherUserName,
                    otherUserId,
                    otherUserImageUrl,
                    unreadCount, // Include the unread message count
                };
            }));
    });
};

loadContacts();

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
            where('userIds', 'array-contains', uid) // Check if uid is in the userIds array
        );
        const querySnapshot = await getDocs(contactsQuery);
        let receiverId = null;

        // Loop through the matching documents
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.userIds.includes(contact.otherUserId)) {
                // Get the other user ID in the array that is not the current user ID
                receiverId = data.userIds.find(id => id !== uid);
            }
        });

        if (receiverId) {
            // If receiverId is found, load the repairer data
            const contactDocRef = doc(db, 'users', contact.otherUserId);
            const contactDoc = await getDoc(contactDocRef);
            const state = await listenForUserStatus(contact.otherUserId, updateUserStatusUI);

            if (contactDoc.exists()) {
                const contactData = contactDoc.data();
                contactId.value = contact.otherUserId;
                contactName.value = contactData.name; // Assuming the field is 'name'
                contactPic.value = contactData.imageUrl; // Assuming the field is 'photoURL'
                contactState.value = state;
                // Load chat history for the receiver
                loadChatHistory(contact.otherUserId, uid);
                // Delete unread messages
                resetUnreadMessages(uid); // Update to delete unread messages for this contact
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

// Function to delete unread messages
const resetUnreadMessages = async (receiverId) => {
    const notificationsRef = dbRef(realtimeDb, `notifications/${receiverId}`); // Get notifications for the current user

    // Retrieve the notifications
    const snapshot = await get(notificationsRef);
    if (snapshot.exists()) {
        const updates = {};

        snapshot.forEach(childSnapshot => {
            const notificationData = childSnapshot.val();
            const notificationKey = childSnapshot.key;

            // Check if the senderId matches the contactId
            if (notificationData.senderId === contactId.value) {
                updates[notificationKey] = { ...notificationData, read: true }; // Set read to true
            }
        });

        // Update notifications in bulk if there are any updates
        if (Object.keys(updates).length > 0) {
            await update(notificationsRef, updates);
            console.log(`Marked notifications as read for senderId: ${contactId}`);
        }
    } else {
        console.log('No notifications found for the user.');
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
        senderId: uid,
        senderName: name,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
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
    position: relative;
    padding: 10px;
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

    .status-container {
        display: flex;
        align-items: center;
        gap: 5px;
        /* Space between the circle and the text */
    }

    .status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
    }

    /* Status colors */
    .online {
        background-color: green;
    }

    .offline {
        background-color: red;
    }

    .status-text {
        margin: 0;
        font-size: 0.9rem;
        color: gray;
    }
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

.quote-card {
    cursor: pointer;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    transition: box-shadow 0.3s;
    min-height: auto;
}

.quote-card:hover {
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
}

.unreadCount {
    position: absolute;
    /* Allows positioning within .chat-info */
    bottom: 0;
    /* Aligns to the bottom */
    right: 0;
    /* Aligns to the right */
    background-color: lightgray;
    color: black;
    padding: 4px 8px;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
    min-width: 20px;
    min-height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}
</style>