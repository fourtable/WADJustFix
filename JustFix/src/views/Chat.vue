<template>
    <div v-if="username" class="container">
        <div class="card">
            <div class="row g-0">
                <!-- Sidebar: List of recent chats -->
                <div class="col-12 col-lg-5 col-xl-3 border-end">
                    <div class="p-3">
                        <input type="text" class="form-control mb-3" placeholder="Search...">
                        <ul class="list-unstyled chat-list">
                            <li v-if="contacts.length === 0" class="text-muted text-center">No recent chats</li>
                            <li v-else v-for="contact in contacts" :key="contact.id" class="chat-item" @click="selectContact(contact)">
                                <img :src="contact.photoURL" class="rounded-circle me-2" width="40" height="40">
                                <div class="chat-info">
                                    <strong>{{ contact.name }}</strong>
                                    <small class="d-block text-muted">{{ contact.status }}</small>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Main Chat Area -->
                <div class="col-12 col-lg-7 col-xl-9 chat-container">
                    <div class="chat-header">
                        <img v-if="selectedContact" :src="selectedContact.photoURL" class="rounded-circle me-2" width="40" height="40">
                        <div v-if="selectedContact">
                            <strong>{{ selectedContact.name }}</strong>
                            <small class="text-muted d-block">Last seen: {{ selectedContact.lastSeen }}</small>
                        </div>
                    </div>

                    <div class="chat-messages">
                        <div v-if="chatHistory.length === 0" class="text-center mt-3">
                            <em>No messages yet. Start the conversation!</em>
                        </div>
                        <div v-else>
                            <div v-for="message in chatHistory" :key="message.id"
                                :class="{'chat-message-right': message.senderId === user.uid, 'chat-message-left': message.senderId !== user.uid}">
                                <div>
                                    <img :src="message.photoURL" width="40" height="40" class="rounded-circle">
                                    <div class="message-content">{{ message.text }}</div>
                                    <small class="text-muted">{{ message.timestamp }}</small>
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



<script>
import Cookies from 'js-cookie';
import { db, auth, useAuth } from "../main"; // Importing your Firebase setup
import { onAuthStateChanged } from "firebase/auth";
import { ref, watch, nextTick, onMounted, reactive } from 'vue';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useChat } from '../main'


export default {
    
    data() {
        return {

        }
    },
    computed: {
        username() {
            return Cookies.get('username') || sessionStorage.getItem('username');
        }
    },
    mounted() {
        // Check authentication state and fetch user data
        onAuthStateChanged(auth, (user) => {
            // console.log(user);
            if (!user) {
                console.error("User is not logged in");
                window.location.href = "./login";  // Redirect to login if not authenticated
            }
        });
    },
    setup() {
        const user = ref(null);
        const contacts = ref([]);
        const chatHistory = ref([]);
        const newMessage = ref('');
        const selectedContact = ref(null);

        onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                user.value = currentUser;
                loadContacts();
            } else {
                window.location.href = './login';
            }
        });

        // Load contacts the user has recently chatted with
        const loadContacts = () => {
            const contactsQuery = query(collection(db, 'contacts'), where('userId', '==', user.value.uid), orderBy('lastMessageTime', 'desc'));
            onSnapshot(contactsQuery, (snapshot) => {
                contacts.value = snapshot.empty ? [] : snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            });
        };

        // Load chat history with a selected contact
        const loadChatHistory = (contactId) => {
            const chatQuery = query(
                collection(db, 'chats'),
                where('participants', 'array-contains', user.value.uid),
                orderBy('timestamp')
            );
            onSnapshot(chatQuery, (snapshot) => {
                chatHistory.value = snapshot.empty ? [] : snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            });
        };

        // Select a contact to chat with
        const selectContact = (contact) => {
            selectedContact.value = contact;
            loadChatHistory(contact.id);
        };

        // Send a message
        const sendMessage = async () => {
            if (newMessage.value.trim()) {
                await addDoc(collection(db, 'chats'), {
                    text: newMessage.value,
                    senderId: user.value.uid,
                    receiverId: selectedContact.value.id,
                    timestamp: serverTimestamp(),
                });
                newMessage.value = '';
            }
        };

        return { user, contacts, chatHistory, newMessage, selectedContact, selectContact, sendMessage };
    }
}
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
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);

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
    flex-direction: column; /* Stack children vertically */
    height: 100%;          /* Full height to fill the parent */
}

.chat-header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #ddd;
    flex-shrink: 0;        /* Prevent the header from shrinking */
    padding: 4%;
}

.chat-messages {
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 220px); /* Adjust according to header height and input group height */
    overflow-y: auto; /* Enable scrolling if necessary */
    flex-grow: 1; /* Allow messages to fill the available space */
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
    display: flex;               /* Enable flexbox for the input group */
    padding: 0.5rem;            /* Add some padding */
    border-top: 1px solid #ddd; /* Optional border for distinction */

    input {
        flex: 1;                 /* Allow input to grow and take available space */
        margin-right: 0.5rem;    /* Space between input and button */
        min-width: 0;           /* Prevent input from overflowing */
        border-radius: 10px !important;
    }

    .btn-success {
        flex-shrink: 0;          /* Prevent button from shrinking */
        border-radius: 50% !important;
    }
}
</style>