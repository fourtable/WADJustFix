<template>
    <div class="container-fluid mt-5 p-5">
      <h2>Host Your Own Event</h2>
      <p>Are you a skilled repair expert? Want to share your expertise with others? Host your own event and inspire a community of learners! Click here to request to organize an event with us.</p>
  
      <form @submit.prevent="submitForm">
        <div class="mb-3">
            <label for="name">Name</label>
            <input type="text" id="name" v-model="form.name" placeholder="Enter your Name" class="form-control" required>
        </div>

        <div class="mb-3">
          <label for="phone">Contact Number</label>
          <input type="text" id="phone" v-model="form.phone" placeholder="Enter your contact number" class="form-control" required />
        </div>
  
        <div class="mb-3">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="form.email" placeholder="Enter your Email" class="form-control" required>
        </div>
        
        <div class="mb-3">
          <label for="category">Repair Category</label>
          <div id="category">
            <div v-for="(category, index) in categories" :key="index" class="form-check">
                <input class="form-check-input" type="checkbox" :id="'category_' + index" :value="category" v-model="form.selectedCategories">
                <label class="form-check-label" :for="'category_' + index">{{ category }}</label>
            </div>
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="other" v-model="form.otherChecked">
                <label class="form-check-label" for="other">Others (please specify)</label>
                <input v-if="form.otherChecked" type="text" v-model="form.otherCategory" class="form-control mt-2" placeholder="Enter your expertise">
            </div>
          </div>
        </div>
  
        <div class="mb-3">
          <label for="details">Event Details</label>
          <textarea v-model="form.details" placeholder="Include duration, schedule, and topics covered" class="form-control"></textarea>
        </div>

        <div class="mb-3">
        <label for="eventDate">Event Date and Time</label>
        <input type="datetime-local" v-model="form.eventDate" class="form-control" required />
      </div>

        <div class="mb-3">
          <label for="price">Pricing</label>
          <input type="number" v-model="form.price" class="form-control" required />
        </div>

        <div class="mb-3">
          <label for="price">Number of pax</label>
          <input type="number" v-model="form.totalPax" class="form-control" required />
        </div>
  
        <div class="mb-3">
          <label for="location">Preferred Location</label>
          <input
            type="text"
            v-model="form.locationDetails"
            placeholder="Enter location details"
            class="form-control"
          />
        </div>
  
        <div class="mb-3">
          <label for="additionalInfo">Additional Information</label>
          <textarea v-model="form.additionalInfo" placeholder="Special equipment, age restrictions, etc." class="form-control"></textarea>
        </div>
  
        <div class="mb-3">
            <input class="form-check-input" type="checkbox" id="terms" v-model="form.agreeToTerms"/>
            <label class="form-check-label" for="terms">I agree to the terms and conditions</label>
        </div>
  
        <button type="submit" class="btn">Submit</button>
      </form>
  
      <div v-if="formSubmitted" class="success-message">
        <p>Thank you for your request! Your registration has been successfully submitted. We will review your request and get back to you within 2-3 business days with further details. Please check your email for updates.</p>
      </div>
    </div>
  </template>
  
  <script>
  import { db } from "../main"; // Import your Firebase instance
  import { collection, addDoc, Timestamp } from "firebase/firestore";

  export default {
    data() {
      return {
        form: {
          name: "",
          phone: "",
          email: "",
          selectedCategories:[],
          otherChecked: false,
          otherExpertise: "",
          category: "",
          details: "",
          eventDate: "",
          price: "",
          totalPax: "",
          locationType: "",
          locationDetails: "",
          additionalInfo: "",
          agreeToTerms: false,
        },
        formSubmitted: false,
        categories: [
          "Home Appliances (e.g., Microwaves, Washing Machines, etc.)",
          "Electrical Systems & Fixtures (e.g., Lighting, Wiring, etc.)",
          "Electronics Repair (e.g., Devices, TVs, etc.)",
          "Plumbing (e.g., Toilets, Heaters, etc.)",
          "Air Conditioning Systems (e.g., Repairing, Maintaining, etc.)",
          "Furniture Repair (e.g., Shelves, Tables, etc.)",
          "Windows & Doors (e.g., Locks, Window Frames, etc.)",
          "Automotive Repairs (e.g., Tires, Brakes, etc.)",
        ],
      };
    },
    methods: {
      async submitForm() {
        try {
          // Clean up selected categories by removing text in parentheses
          const cleanedCategories = this.form.selectedCategories.map(category => {
            return category.replace(/\s*\(.*?\)/, '').trim();
          });

          // Prepare the form data
          const formData = {
            ...this.form,
            categories: cleanedCategories, // Use the cleaned categories
            eventDate: new Date(this.form.eventDate),
            submittedAt: new Date(),
            status: 'pending'
          };

          // Add other category if specified
          if (this.form.otherChecked && this.form.otherCategory) {
            formData.categories.push(this.form.otherCategory);
          }

          // Send to Firestore
          await addDoc(collection(db, 'eventRequest'), formData);
          
          // Show success message
          this.formSubmitted = true;
          
          // Reset form after successful submission
          setTimeout(() => {
            this.resetForm();
          }, 5000);
          
        } catch (error) {
          console.error("Error submitting form:", error);
          alert("There was an error submitting your application. Please try again.");
        }
      },
      resetForm() {
      this.form = {
        name: "",
        phone: "",
        email: "",
        selectedCategories: [],
        otherChecked: false,
        otherExpertise: "",
        details: "",
        price: "",
        totalPax: "",
        locationDetails: "",
        additionalInfo: "",
        agreeToTerms: false,
      };
      this.formSubmitted = false;
    }
    },
  };
  </script>
  
  <style scoped>
.container-fluid {
  max-width: 600px; /* Limits the width */
  width: 90%; /* Responsive width for smaller screens */
  margin: 0 auto; /* Centers the container */
  padding: 20px;
}
  .organize-event-form {
    max-width: 600px;
    margin: auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f9f9f9;
  }
  .form-control{
    border-radius: 20px;
    padding: 10px;
}
  .success-message {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  .btn {
  padding: 5px 10px;
  border: 1px solid #085c44;
  border-radius: 30px;
  color: #085c44;
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  cursor: pointer;
}
.btn:hover {
  background-color: #085c44;
  color: white;
}
  </style>
  