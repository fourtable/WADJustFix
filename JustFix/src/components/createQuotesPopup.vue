<template>
  <div>
    <!-- Button to trigger modal -->
    <button type="button" class="btn btn-primary" @click="showModal = true">
      {{ btnName }}
    </button>

    <!-- Modal -->
    <div class="modal fade" :class="{ show: showModal }" :style="{ display: showModal ? 'block' : 'none' }"
      tabindex="-1" aria-labelledby="popupFormLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="popupFormLabel">Create Quote</h5>
            <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
          </div>
          <div class="modal-body" style="text-align: left;">
            <form @submit.prevent="handleSubmit">
              <!-- Item Name -->
              <div class="mb-3">
                <label for="item" class="form-label">Item</label>
                <input type="text" class="form-control" id="item" v-model="formData.item" required />
              </div>

              <!-- Item Category Dropdown -->
              <div class="mb-3">
                <label for="category" class="form-label">Category</label>
                <select id="category" class="form-select" v-model="formData.category" required>
                  <option disabled value="">Select a category</option>
                  <option v-for="category in categories" :key="category" :value="category">
                    {{ category }}
                  </option>
                </select>
              </div>

              <!-- Picture -->
              <div class="mb-3">
                <label for="picture" class="form-label">Picture</label>
                <input type="file" class="form-control" id="picture" @change="handleFileUpload" required/>
              </div>

              <!-- Description -->
              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea class="form-control" id="description" v-model="formData.description" rows="3"
                  required></textarea>
              </div>

              <button type="submit" class="btn btn-primary">Save Quote</button>
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
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import Cookies from 'js-cookie';
import { ref, defineEmits } from 'vue';

const uid = Cookies.get('uid') || sessionStorage.getItem('uid');
const showModal = ref(false);

export default {
  props: {
    show: {
      type: Boolean,
      required: true,
    },
    btnName: '',
  },
  data() {
    return {
      showModal: false,
      formData: {
        item: '',
        category: '',
        picture: null,
        description: '',
      },
      categories: [
        'Home Appliances',
        'Electrical Fixtures',
        'Plumbing',
        'Air Conditioners',
        'Electronics Repair',
        'Furniture Assembly and Repair',
        'Windows and Doors',
        'Automotive Repairs',
        'Miscellaneous Repairs',
      ],
    };
  },
  watch: {
    show(newValue) {
      this.showModal = newValue;
    },
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.formData.picture = file;
      }
    },
    async handleSubmit() {
      try {
        let pictureUrl = null;

        // Check if a picture was uploaded
        if (this.formData.picture) {
          const storagePath = `quotes/${uid}/${this.formData.picture.name}`;
          const pictureRef = storageRef(storage, storagePath); // Correctly reference storage

          // Upload the picture to Firebase Storage
          await uploadBytes(pictureRef, this.formData.picture);

          // Get the download URL of the uploaded picture
          pictureUrl = await getDownloadURL(pictureRef);
        }

        // Add the new quote to the Firestore collection
        const quotesCollection = collection(db, 'quotes');
        await addDoc(quotesCollection, {
          item: this.formData.item,
          category: this.formData.category,
          picture: pictureUrl, // Store the URL of the uploaded image
          description: this.formData.description,
          userId: uid,
          repairerId: '',
          timestamp: serverTimestamp(),
        });

        console.log('Quote saved successfully');
        this.closeModal();
      } catch (error) {
        console.error('Error saving quote:', error);
      }
    },
    closeModal() {
      this.showModal = false;
      this.formData = {
        item: '',
        category: '',
        picture: null,
        description: '',
      };
      this.$emit('close'); // Emit close event to notify parent component
    },
  },
};
</script>

<style scoped>
.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style>