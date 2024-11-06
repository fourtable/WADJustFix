<template>
  <div>
    <button class="btn btn-danger btn-sm table-button mb-2 mb-xl-0" @click="openRejectPopup">Reject</button>

    <div v-if="showRejectPopup" class="modal" tabindex="-1" role="dialog" style="display: block;">
      <!-- Added v-if and style -->
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Reject Quote</h5>
            <button type="button" class="close" @click="closeRejectPopup">
              <span>&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <p>Warning: You will get points deducted for rejecting an in progress item</p>
            <label for="rejectReason">Reason for Rejection:</label>
            <textarea v-model="rejectReason" required class="form-textarea"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-success" @click="closeRejectPopup">Cancel</button>
            <button type="button" class="btn btn-danger" @click="submitRejection">Submit</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db, realtimeDb } from '../main';
import { ref as dbRef, push } from 'firebase/database'
import { doc, updateDoc, addDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import Cookies from 'js-cookie';

export default {
  props: {
    quote: { // Accept quote as a prop
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showRejectPopup: false,
      rejectReason: '',
    };
  },
  computed: {
    uid() {
      return Cookies.get('uid') || sessionStorage.getItem('uid');
    },
    userType() {
      return Cookies.get('userType') || sessionStorage.getItem('userType');
    },
    username() {
      return Cookies.get('username') || sessionStorage.getItem('username');
    },
    userPicture() {
      return Cookies.get('profilePic') || sessionStorage.getItem('profilePic');
    },
  },
  methods: {
    openRejectPopup() {
      this.showRejectPopup = true;
    },
    closeRejectPopup() {
      this.showRejectPopup = false;
      this.rejectReason = ''; // Clear reason when closing
    },
    async submitRejection() {
      console.log('Rejection data submitted:', this.quote); // Debugging
      this.closeRejectPopup(); // Close the popup after submission
      try {
        // Reference to the specific quote document
        const quoteRef = doc(db, 'quotes', this.quote.id);
        // Update the document
        await updateDoc(quoteRef, {
          repairerId: '',
          repairerName: '',
          status: 'Rejected' // Update the status to 'Rejected'
        });
        const pointCollection = collection(db, 'points');
        await addDoc(pointCollection, {
          Date: serverTimestamp(),
          userId: this.uid,
          points: -10,
        });
        this.notifyUser(this.quote.userId, "Quote Rejected");
        console.log("Quote rejected");
      } catch (error) {
        console.error('Error rejecting quote:', error);
      }
      // Implement your logic to save this data to Firestore or your backend
    },
    async notifyUser(receiverId, message) {
      const notificationRef = dbRef(realtimeDb, `notifications/${receiverId}`);
      await push(notificationRef, {
        notificationType: 'message',
        senderId: this.uid,
        senderName: this.username,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
      });
      await this.sendMessage(message, this.uid, receiverId)
      console.log('Notification sent to:', receiverId);
    },
    async sendMessage(message, senderId, receiverid) {
      if (message.trim()) {
        try {
          const [firstUserId, secondUserId] = [senderId, receiverid].sort();
          const arrayIds = [firstUserId, secondUserId];
          const chatDocRef = await addDoc(collection(db, 'chats'), {
            text: message,
            senderId: senderId,
            receiverId: receiverid,
            timestamp: serverTimestamp(),
            participants: arrayIds,
            photoURL: this.userPicture,
          });

          // Check if the contact is already in the user’s recent chats
          const contactsQuery = query(
            collection(db, 'contacts'),
            where('userIds', '==', arrayIds),
          );
          const querySnapshot = await getDocs(contactsQuery);

          if (querySnapshot.empty) {
            // If no existing contact, add new with userIds as an array
            await addDoc(collection(db, 'contacts'), {
              userIds: arrayIds,
              lastMessageTime: serverTimestamp(),
            });
          } else {
            // Update the lastMessageTime for the existing contact
            await updateDoc(querySnapshot.docs[0].ref, { lastMessageTime: serverTimestamp() });
          }
        } catch (error) {
          console.error("Error sending message:", error);
        }
      }
    },
  },
};
</script>

<style>
.modal {
  display: flex;
  position: fixed;
  z-index: 1050;
  /* High enough to overlay other elements */
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.5);
  /* Dark semi-transparent background */
  justify-content: center;
  /* Center the modal */
  align-items: center;
  /* Center vertically */
}

.modal-dialog {
  max-width: 500px;
  /* Maximum width of the modal */
  width: 100%;
  /* Full width on small screens */
  margin: auto;
  /* Center the modal dialog */
}

.modal-content {
  background-color: #ffffff;
  /* White background for the modal content */
  border-radius: 8px;
  /* Rounded corners */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  /* Subtle shadow for depth */
  padding: 20px;
  /* Padding around the content */
}

.modal-header {
  border-bottom: 1px solid #dee2e6;
  /* Light border at the bottom */
}

.modal-title {
  margin: 0;
  /* Remove default margin */
}

.close {
  border: none;
  /* Remove default button styling */
  background: transparent;
  /* Transparent background */
  font-size: 1.5rem;
  /* Increase font size for close button */
}

.modal-body {
  padding: 15px 0;

  /* Padding for the body */
  p {
    font-size: 20px;
  }
}

label {
  font-weight: bold;
  /* Bold labels */
  display: block;
  /* Make labels block elements */
  margin-bottom: 8px;
  /* Space below labels */
}

textarea {
  width: 100%;
  /* Full width */
  height: 100px;
  /* Fixed height for textarea */
  padding: 10px;
  /* Padding inside textarea */
  border: 1px solid #ced4da;
  /* Light border */
  border-radius: 4px;
  /* Rounded corners */
  resize: none;
  /* Prevent resizing */
}

.modal-footer {
  display: flex;
  /* Use flexbox for footer */
  justify-content: space-between;
  /* Space out buttons */
}

.btn {
  padding: 10px 15px;
  /* Button padding */
}
</style>
