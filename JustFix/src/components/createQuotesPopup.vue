<template>
    <div>
      <!-- Button to trigger modal -->
      <button type="button" class="btn btn-success" @click="showModal = true">
        Create Quote
      </button>
  
      <!-- Modal -->
      <div
        class="modal fade"
        :class="{ show: showModal }"
        :style="{ display: showModal ? 'block' : 'none' }"
        tabindex="-1"
        aria-labelledby="popupFormLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="popupFormLabel">Create Quote</h5>
              <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="handleSubmit">
                <!-- Item Name -->
                <div class="mb-3">
                  <label for="item" class="form-label">Item</label>
                  <input
                    type="text"
                    class="form-control"
                    id="item"
                    v-model="formData.item"
                    required
                  />
                </div>
  
                <!-- Item Category Dropdown -->
                <div class="mb-3">
                  <label for="category" class="form-label">Category</label>
                  <select
                    id="category"
                    class="form-select"
                    v-model="formData.category"
                    required
                  >
                    <option disabled value="">Select a category</option>
                    <option v-for="category in categories" :key="category" :value="category">
                      {{ category }}
                    </option>
                  </select>
                </div>
  
                <!-- Picture -->
                <div class="mb-3">
                  <label for="picture" class="form-label">Picture</label>
                  <input
                    type="file"
                    class="form-control"
                    id="picture"
                    @change="handleFileUpload"
                  />
                </div>
  
                <!-- Description -->
                <div class="mb-3">
                  <label for="description" class="form-label">Description</label>
                  <textarea
                    class="form-control"
                    id="description"
                    v-model="formData.description"
                    rows="3"
                    required
                  ></textarea>
                </div>
  
                <button type="submit" class="btn btn-primary">Save Quote</button>
              </form>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Modal backdrop -->
      <div
        v-if="showModal"
        class="modal-backdrop fade show"
        @click="closeModal"
      ></div>
    </div>
  </template>
  
  <script>
  import { collection, addDoc } from 'firebase/firestore';
  
  export default {
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
    methods: {
      handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
          this.formData.picture = file;
        }
      },
      async handleSubmit() {
        try {
          const quotesCollection = collection(db, 'quotes');
          await addDoc(quotesCollection, {
            item: this.formData.item,
            category: this.formData.category,
            picture: this.formData.picture ? this.formData.picture.name : null,
            description: this.formData.description,
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
  