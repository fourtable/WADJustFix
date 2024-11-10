<template>
  <div>
    <!-- Button to trigger modal -->
    <button type="button" :class="buttonClass" :disabled="disableStatus" @click="openModal">
      {{ btnName }}
    </button>

    <!-- Modal -->
    <div class="modal fade" :class="{ show: showModal }" :style="{ display: showModal ? 'block' : 'none' }"
      tabindex="-1" aria-labelledby="popupFormLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="popupFormLabel">{{ localAction }} Quote</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body" style="text-align: left;">
            <form @submit.prevent="handleSubmit">
              <!-- Form fields -->
              <div class="mb-3">
                <label for="item" class="form-label">Item</label>
                <input type="text" v-model="formData.item" class="form-control" id="item">
              </div>
              <div class="mb-3">
                <label for="category" class="form-label">Category</label>
                <select v-model="formData.category" class="form-control" id="category">
                  <option disabled value="">Select a category</option>
                  <option v-for="option in expertiseOptions" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label for="picture" class="form-label">Picture</label>
                <!-- Display the image if it exists in formData.picture -->
                <div v-if="formData.picture" class="mb-3">
                  <img :src="formData.picture" alt="Quote Image" class="img-fluid"
                    style="max-width: 100%; max-height: 200px;">
                </div>
                <!-- Input for updating picture -->
                <input type="file" @change="onFileChange" class="form-control" id="picture">
              </div>
              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea v-model="formData.description" class="form-control" id="description"></textarea>
              </div>
              <button type="submit" class="btn" style="background-color: black; color:white;">
                {{ localAction === 'Edit' ? 'Update Quote' : 'Create Quote' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal backdrop -->
    <div v-if="showModal" class="modal-backdrop fade show" @click="closeModal"></div>
  </div>
</template>

<script>
import { db, storage } from '../main';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import Cookies from 'js-cookie';

export default {
  props: {
    show: Boolean,
    btnName: String,
    action: String, // 'Create' or 'Edit'
    editQuote: {
      type: Object,
      default: () => ({}),
    },
    disableStatus: Boolean,
  },
  data() {
    return {
      localAction: '', // Local property for handling action
      formData: {
        item: '',
        category: '',
        picture: null,
        description: '',
      },
      showModal: this.show,
      expertiseOptions: [
        "Home Appliances",
        "Electrical Fixtures",
        "Plumbing",
        "Air Conditioners",
        "Electronics Repair",
        "Furniture Assembly and Repair",
        "Windows and Doors",
        "Automotive Repairs",
        "Miscellaneous Repairs"
      ],
      uid: Cookies.get('uid') || sessionStorage.getItem('uid'),
      userName: Cookies.get('username') || sessionStorage.getItem('username'),
    };
  },
  created() {
    this.localAction = this.action;
  },
  watch: {
    show(newVal) {
      this.showModal = newVal;
    },
    editQuote: {
      immediate: true,
      handler(newQuote) {
        if (this.localAction === 'Edit' && newQuote.id) {
          this.loadQuote(newQuote.id);
        }
      },
    },
  },
  methods: {
    async loadQuote(id) {
      try {
        const quoteRef = doc(db, 'quotes', id);
        const quoteSnapshot = await getDoc(quoteRef);
        if (quoteSnapshot.exists()) {
          this.formData = {
            item: quoteSnapshot.data().item || '',
            category: quoteSnapshot.data().category || '',
            picture: quoteSnapshot.data().picture || null,
            description: quoteSnapshot.data().description || '',
          };
          this.localAction = 'Edit';
        } else {
          console.error('No such document!');
        }
      } catch (error) {
        console.error('Error fetching document:', error);
      }
    },
    openModal() {
      this.showModal = true;
      if (this.localAction === 'Edit' && this.editQuote.id) {
        this.loadQuote(this.editQuote.id);
      }
    },
    async handleSubmit() {
      try {
        if (this.localAction === 'Edit') {
          // Update existing quote in Firestore
          const quoteRef = doc(db, 'quotes', this.editQuote.id);
          await updateDoc(quoteRef, {
            item: this.formData.item,
            category: this.formData.category,
            picture: this.formData.picture, // Ensure picture is a URL or the required file format
            description: this.formData.description,
          });
          this.showNotification("Quote updated successfully", 'alert');
          // console.log('Quote updated successfully');
        } else {
          // Create a new quote in Firestore
          await addDoc(collection(db, 'quotes'), {
            item: this.formData.item,
            category: this.formData.category,
            picture: this.formData.picture, // Ensure picture is a URL or the required file format
            description: this.formData.description,
            timestamp: new Date(), // Adding a timestamp if needed
            userId: this.uid,
            userName: this.userName,
            repairerId: '',
          });
          this.showNotification("Quote created!", 'alert');
        }

        // Close the modal after saving
        this.closeModal();
        this.$emit('saved'); // Emit an event to notify parent component if needed

      } catch (error) {
        console.error('Error saving quote:', error);
      }
    },
    closeModal() {
      this.showModal = false;
      this.resetFormData();
      this.$emit('close');
    },
    resetFormData() {
      this.formData = {
        item: '',
        category: '',
        picture: null,
        description: '',
      };
    },
    async uploadImageToFirebase(file) {
      try {
        // Create a storage reference
        const storageRef = ref(storage, `images/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL; // This persistent URL can now be used
      } catch (error) {
        return null;
      }
    },
    async onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.formData.picture = await this.uploadImageToFirebase(file);
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
  computed: {
    buttonClass() {
      return this.btnName === 'Edit' ? 'btn btn-warning btn-sm table-button' : 'btn btn-primary';
    },
  },
};
</script>
