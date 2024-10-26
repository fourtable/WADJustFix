<template>
  <div class="profile-container">
    <h2>Edit Profile</h2>
    <form @submit.prevent="updateProfile">
      <!-- Profile Picture -->
      <div class="mb-3">
        <label for="profilePic" class="form-label">Profile Picture</label>
        <input type="file" class="form-control" id="profilePic" @change="onFileChange" />
        <div v-if="profilePicFile">
          <img :src="createObjectURL(profilePicFile)" alt="Profile Pic Preview" style="max-width: 150px; margin-top: 10px;" />
        </div>
      </div>

      <!-- Name Input -->
      <div class="mb-3">
        <label for="name" class="form-label">Name</label>
        <input type="text" class="form-control" id="name" v-model="profile.name" required />
      </div>

      <!-- Repairer-specific Fields -->
      <div v-if="profile.userType === 'repairer'">
        <div class="mb-3">
          <label for="experience" class="form-label">Years of Experience</label>
          <select id="experience" v-model="profile.experience" class="form-control">
            <option value="" disabled>Select</option>
            <option value="0">Less than 1 year</option>
            <option value="1">1-3 years</option>
            <option value="2">3-5 years</option>
            <option value="4">More than 5 years</option>
          </select>
        </div>

        <!-- Expertise Checkboxes -->
        <div class="mb-3">
          <label class="form-label">Area of Expertise</label>
          <div id="expertiseOptions">
            <div v-for="(expertise, index) in expertiseList" :key="index" class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                :id="'expertise_' + index"
                :value="expertise"
                v-model="profile.expertise"
              />
              <label class="form-check-label" :for="'expertise_' + index">{{ expertise }}</label>
            </div>

            <!-- Other Expertise Input -->
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="other" v-model="profile.otherChecked" />
              <label class="form-check-label" for="other">Others (please specify)</label>
              <input
                v-if="profile.otherChecked"
                type="text"
                v-model="profile.otherExpertise"
                class="form-control mt-2"
                placeholder="Enter your expertise"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Description Field -->
      <div class="mb-3">
        <label for="description" class="form-label">Description</label>
        <textarea
          id="description"
          v-model="profile.description"
          class="form-control"
          rows="4"
          placeholder="Write something about yourself..."
        ></textarea>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn btn-primary">Save Changes</button>
    </form>
  </div>
</template>

<script>
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { storage, db, auth } from '../main'; // Assuming main.js exports the Firebase instances
import { onAuthStateChanged } from 'firebase/auth';

export default {
  data() {
    return {
      profile: {
        name: Cookies.get('username'),
        userType: '',
        experience: '',
        expertise: [], // Initialize as an empty array
        description: '',
        otherChecked: false,
        otherExpertise: '',
        imageUrl: '',
      },
      profilePicFile: null,
      expertiseList: [
        "Home Appliances (e.g, Microwaves, Ovens, etc.)",
        "Devices (e.g, Phones, Computers, etc.)",
        "Networking Devices (e.g, Routers, Modems, etc.)",
        "Photography Equipment (e.g, Cameras, Drones, etc.)",
        "Audio/Visual Equipment (e.g, Speakers, Projectors, etc.)",
        "Printers and Scanners (e.g, Inkjet, Printer, etc.)",
      ],
    };
  },
  methods: {
    onFileChange(event) {
      this.profilePicFile = event.target.files[0];
    },
    createObjectURL(file) {
      return window.URL.createObjectURL(file); // Fix for createObjectURL
    },
    async updateProfile() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User is not authenticated.');
      }
      const userId = user.uid;

      // Ensure expertise is always an array before processing
      if (!Array.isArray(this.profile.expertise)) {
        this.profile.expertise = [];
      }

      // Include other expertise if checked
      if (this.profile.otherChecked && this.profile.otherExpertise) {
        this.profile.expertise.push(this.profile.otherExpertise);
      }

      // Upload profile picture if a new one is selected
      if (this.profilePicFile) {
        const profilePicRef = storageRef(storage, `profile_pics/${userId}.jpg`);
        await uploadBytes(profilePicRef, this.profilePicFile);
        this.profile.imageUrl = await getDownloadURL(profilePicRef);
      }

      // Update Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        name: this.profile.name,
        userType: this.profile.userType,
        experience: this.profile.experience,
        expertise: this.profile.expertise,
        description: this.profile.description,
        imageUrl: this.profile.imageUrl
      });

      console.log('Profile updated successfully');
      alert('Profile updated');
      await this.fetchUserProfile(userId);

      // Emit the updated profile info (username and profile image) to be used in other components like Navbar
      const event = new CustomEvent('profileUpdated', {
        detail: {
          username: this.profile.name,
          profileImage: this.profile.imageUrl,
        }
      });
      window.dispatchEvent(event);  // Dispatch event globally so other components like Navbar can listen to it.

    } catch (error) {
      console.error('Error updating profile:', error.message);
    }
  }
,
    async fetchUserProfile(uid) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        this.profile = userDoc.data();

        // Ensure `expertise` is an array
        if (!Array.isArray(this.profile.expertise)) {
          this.profile.expertise = [];
        }

        // Only process expertise if the user is a repairer
        if (this.profile.userType === 'repairer') {
          if (this.profile.expertise.includes(this.profile.otherExpertise)) {
            this.profile.otherChecked = true;
          }
        } else {
          this.profile.expertise = []; // Ensure expertise is empty for non-repairers
        }
      } else {
        console.error('No user data found!');
      }
    },
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.fetchUserProfile(user.uid);
      } else {
        console.error('User is not logged in');
        window.location.href = '../login.html'; // Redirect to login if not authenticated
      }
    });
  },
};
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 50px auto;
  padding: 30px;
  background-color: #ffffff;
  border: 1px solid #f7f7f7;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mb-3 {
  margin-bottom: 1rem;
}

.form-label {
  font-weight: bold;
}

.form-control {
  margin-top: 5px;
}
</style>
