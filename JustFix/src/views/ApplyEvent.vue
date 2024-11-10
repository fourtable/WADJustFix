<template>
    <div class="container-fluid mt-5 p-5">
      <button @click="$router.push('/event')" class="back mb-3"><</button>
      <h2>Host Your Own Event</h2>
      <p>Are you a skilled repair expert? Want to share your expertise with others? Host your own event and inspire a community of learners! Click here to request to organize an event with us.</p>
      
      <form @submit.prevent="submitForm">
        <div class="mb-3">
            <label for="name">Name</label>
            <input type="text" id="name" v-model="form.name" placeholder="Enter your Name" class="form-control" required>
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
                <input v-if="form.otherChecked" type="text" v-model="form.otherCategory" class="form-control mt-2" placeholder="Enter the relevant category">
            </div>
          </div>
        </div>

        <div class="mb-3">
        <label for="title">Event Title</label>
        <input type="text" v-model="form.title" class="form-control" required />
      </div>

      <div class="mb-3">
          <label for="description">Event Description</label>
          <textarea v-model="form.description" placeholder="Please state the outline of your event (with a timeline), duration (1/2 days, etc) and what the participants will learn." class="form-control"></textarea>
        </div>

        <div class="mb-3">
          <label for="eventDate">Event Date and Time</label>
          <input type="datetime-local" v-model="form.eventDate" class="form-control" :min="minDate" required />
        </div>

        <div class="mb-3">
          <label for="registrationDeadline">Registration Deadline</label>
          <input type="date" v-model="form.registrationDeadline" class="form-control" :max="maxRegistrationDate" required />
        </div>

        <div class="mb-3">
          <label for="duration">Duration (hours)</label>
          <input type="number" v-model="form.duration" class="form-control" min="1" required />
        </div>

        <div class="mb-3">
          <label for="price">Number of slots</label>
          <input type="number" v-model="form.totalSlots" class="form-control" min="1" required />
        </div>
  
        <div class="mb-3">
        <label for="locationInput">Event Venue</label>
        <input
          id="locationInput"
          ref="locationInput"
          type="text"
          class="form-control"
          placeholder="Search for a location in Singapore"
          @focus="initializeAutocomplete"
        />
      </div>

      <!-- Read-only fields to display selected location details -->
      <div class="mb-3">
        <label for="locationName">Venue Name</label>
        <input
          id="locationName"
          type="text"
          class="form-control"
          v-model="form.locationName"
          readonly
          placeholder="Selected venue name will appear here"
        />
      </div>

      <div class="mb-3">
        <label for="address">Full Address</label>
        <input
          id="address"
          type="text"
          class="form-control"
          v-model="form.address"
          readonly
          placeholder="Selected address will appear here"
        />
      </div>
      <div class="mb-3">
        <label for="eventImage">Picture</label>
        <input type="file" class="form-control" id="eventImage" @change="onFileChange" />
        <div v-if="form.imageUrl">
          <img :src="form.imageUrl" alt="Event Image" />
        </div>
      </div>

        <div class="mb-3">
            <input class="form-check-input" type="checkbox" id="terms" v-model="form.agreeToTerms"/>
            <label class="form-check-label" for="terms">I agree to the terms and conditions</label>
        </div>
  
        <button type="submit" class="btn center-submit">Submit</button>
      </form>
  
      <div v-if="formSubmitted" class="success-message">
        <p>Thank you for your request! Your registration has been successfully submitted. We will review your request and get back to you within 2-3 business days with further details. Please check your email for updates.</p>
      </div>
    </div>
  </template>
  
  <script>
  import { db } from "../main"; // Import your Firebase instance
  import { collection, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
  import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
  import Cookies from 'js-cookie';

  export default {
    data() {
      return {
        form: {
          uid:'',
          name: '',
          email: "",
          selectedCategories:[],
          otherChecked: false,
          otherCategory: "",
          title:"",
          description: "",
          eventDate: "",
          registrationDeadline:"",
          duration: "",
          totalSlots: "",
          vacantSlots: "", 
          locationType: "",
          locationDetails: "",
          agreeToTerms: false,
          imageUrl: ""
        },
        formSubmitted: false,
        eventImage: null,
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
    async created() {
        // Auto-populate form with user data
        const username = sessionStorage.getItem('username') || Cookies.get('username');
        const userEmail = sessionStorage.getItem('email') || Cookies.get('email');
        
        if (username) {
            this.form.name = username;
        }
        if (userEmail) {
            this.form.name = userEmail;
        }
        
        // Get user details from Firestore
        const uid = sessionStorage.getItem('uid') || Cookies.get('uid');
        if (uid) {
            try {
                const userDoc = await this.getUserDetails(uid);
                if (userDoc) {
                    this.form.uid = uid; // Store uid directly in this.form.uid
                    this.form.name = userDoc.name || this.form.name;
                    this.form.email = userDoc.email || this.form.email;
                }
            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        }
    },
    computed: {
      minDate() {
        const today = new Date();
        return today.toISOString().slice(0, 16);
      },
      maxRegistrationDate() {
        return this.form.eventDate ? this.form.eventDate.split('T')[0] : null;
      },
      isFormValid() {
        return (
          this.form.selectedCategories.length > 0 || 
          (this.form.otherChecked && this.form.otherCategory.trim() !== "")
        ) && this.form.agreeToTerms;
      }
  },
    methods: {
      async getUserDetails(uid) {
            try {
                const userDoc = doc(db, "users", uid);
                const userSnapshot = await getDoc(userDoc);
                if (userSnapshot.exists()) {
                    return userSnapshot.data();
                }
                return null;
            } catch (error) {
                console.error("Error fetching user details:", error);
                return null;
            }
        },
      initializeAutocomplete() {
      // Only initialize once
      if (this.autocomplete) return;

      const input = this.$refs.locationInput;
      this.autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'SG' },
        fields: ['name', 'formatted_address', 'geometry', 'place_id']
      });

      this.autocomplete.addListener('place_changed', () => {
        const place = this.autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          console.error('No details available for input:', input.value);
          return;
        }

        // Save location details to form
        this.form.locationName = place.name || '';
        this.form.address = place.formatted_address || '';
        this.form.coordinates = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
      });
      },
      onFileChange(event) {
        const file = event.target.files[0];
        if (file) {
          this.eventImage = file;
        }
      },
      async submitForm() {
        try {
          // Clean up selected categories by removing text in parentheses
          const cleanedCategories = (this.form.selectedCategories || []).map(category => {
            return category.replace(/\s*\(.*?\)/, '').trim();
          });
          
          // Add other category if specified
          if (this.form.otherChecked && this.form.otherCategory.trim()) {
            cleanedCategories.push(this.form.otherCategory.trim());
          }
          
          // Upload image to Firebase Storage if a file is selected
          let imageUrl = "";
          if (this.eventImage) {
            const storage = getStorage();
            const storageRef = ref(storage, `eventImages/${this.eventImage.name}`);
            await uploadBytes(storageRef, this.eventImage)
              .then(async (snapshot) => {
                console.log("Uploaded image successfully");
                imageUrl = await getDownloadURL(snapshot.ref);
              })
              .catch((error) => {
                console.error("Error uploading image:", error);
              });
          }

          this.form.vacantSlots = this.form.totalSlots; 
          
          // Prepare the form data
          const formData = {
            organiserID: this.form.uid, // Use uid directly here
            name: this.form.name || "",
            email: this.form.email || "",
            category: cleanedCategories || [],
            title: this.form.title || "",
            description: this.form.description || "",
            eventDate: this.form.eventDate ? new Date(this.form.eventDate) : null,
            registrationDeadline: this.form.registrationDeadline ? new Date(this.form.registrationDeadline) : null,
            duration: this.form.duration ? Number(this.form.duration) : 0,
            totalSlots: this.form.totalSlots ? Number(this.form.totalSlots) : 0,
            vacantSlots: this.form.vacantSlots ? Number(this.form.vacantSlots) : 0,
            locationName: this.form.locationName || "",
            address: this.form.address || "",
            coordinates: this.form.coordinates || {}, // Ensures coordinates are stored as an object with lat and lng
            imageUrl: imageUrl || "",
            submittedAt: new Date(),
            status: 'pending'
          };
          
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
      }

,
      resetForm() {
      this.form = {
        userId:'',
        name: "",
        email: "",
        selectedCategories: [],
        otherChecked: false,
        otherCategory: "",
        title: "",
        description: "",
        eventDate: "",
        registrationDeadline: "",
        duration: "",
        totalSlots: "",
        agreeToTerms: false,
        imageUrl: "",
      };
      this.formSubmitted = false;
      this.eventImage=null;
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
.center-submit {
  display: flex;
  justify-content: center;
}
.back{
  padding: 5px 10px;
  border: 1px solid #085c44;
  border-radius: 30px;
  color: #085c44;
  display: inline-flex;
  align-items: center;
  margin-top: 10px;
  cursor: pointer;
  background-color: white;
}
  </style>
  