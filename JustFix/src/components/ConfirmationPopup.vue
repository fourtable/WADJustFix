<template>
    <div>
        <!-- Delete button -->
        <button class="btn btn-danger btn-sm table-button mb-2 mb-xl-0 d-flex" :disabled="disableStatus"
            @click="openDeleteConfirmPopup">Delete</button>

        <!-- Confirmation Modal -->
        <div v-if="showConfirmPopup" class="modal" tabindex="-1" role="dialog" style="display: block;">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirm Deletion</h5>
                        <button type="button" class="close" @click="closeDeleteConfirmPopup">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this quote?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeDeleteConfirmPopup">Cancel</button>
                        <button type="button" class="btn btn-danger" @click="confirmDeleteQuote">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { db } from '../main'; // Assuming Firebase Firestore is initialized in main.js
import { doc, deleteDoc } from 'firebase/firestore';

export default {
    props: {
        quote: {
            type: Object,
            required: true
        },
        disableStatus: Boolean,
    },
    data() {
        return {
            showConfirmPopup: false,  // Tracks the visibility of the confirmation popup
        };
    },
    methods: {
        // Open confirmation popup
        openDeleteConfirmPopup() {
            this.showConfirmPopup = true;
        },
        // Close confirmation popup
        closeDeleteConfirmPopup() {
            this.showConfirmPopup = false;
        },
        // Confirm delete action
        async confirmDeleteQuote() {
            try {
                // Reference to the specific quote document in Firestore
                const quoteRef = doc(db, 'quotes', this.quote.id);

                // Delete the quote from Firestore
                await deleteDoc(quoteRef);

                console.log("Quote deleted successfully");
                this.showNotification('Quote deleted successfully', 'alert');

                // Close the confirmation popup after deletion
                this.closeDeleteConfirmPopup('Quote deleted successfully', 'alert');
            } catch (error) {
                console.error("Error deleting quote:", error);
            }
        },
        showNotification(message, type) {
            const notification = {
                type: type,
                message: message,
                timestamp: new Date().toISOString(),
                isVisible: true,
            };
            console.log('Dispatching notification:', notification);
            this.$store.dispatch('addNotification', notification); // Dispatch the action to add notification

        },
    },
};
</script>

<style scoped>
/* Inside the component where the Review button is */
.table-button {
    width: 140px;
    /* Adjust width as needed */
    height: 30px;
    /* Adjust height as needed */
    font-size: 16px;
    /* Optional: Adjust font size to fit */
    padding: 10px;
    /* Optional: Add padding for more space inside */
    border-radius: 25px;
}
</style>
