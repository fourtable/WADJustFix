<template>
  <div class="profile-container">
    <h2 style="font-weight:500">Edit Profile</h2>

    <form @submit.prevent="updateProfile">
      <!-- Profile Picture -->
      <div class="mb-3">
        <label for="profilePic" class="form-label">Profile Picture</label>
        <input type="file" class="form-control" id="profilePic" @change="onFileChange" />
        <div v-if="profilePicFile">
          <img :src="createObjectURL(profilePicFile)" alt="Profile Pic Preview"
            style="max-width: 150px; margin-top: 10px;" />
        </div>
      </div>

      <!-- Name Input -->
      <div class="mb-3">
        <label for="name" class="form-label">Name</label>
        <input type="text" class="form-control" id="name" v-model="profile.name" required />
      </div>

      <!-- Repairer-specific Fields -->
      <div v-if="profile.userType === 'repairer'">
        <label>Area of Expertise</label>

        <!-- Display selected expertise pills -->
        <div id="selectedExpertise">
          <div v-for="(expertise, index) in formData.expertise" :key="index" class="selected-expertise-pill">
            {{ expertise }}
            <span @click="removeExpertise(expertise)" class="remove-expertise">X</span>
          </div>
        </div>

        <!-- Display available expertise options -->
        <div id="expertiseOptions">
          <div v-for="(expertise, index) in availableExpertise" :key="index" class="expertise-pill"
            @click="toggleExpertise(expertise)">
            {{ expertise }}
          </div>
          <div v-if="formData.otherChecked" class="expertise-pill">
            {{ formData.otherExpertise }}
          </div>
        </div>

        <!-- Custom Expertise Input -->
        <div v-if="formData.otherChecked">
          <label for="otherExpertise">Please specify your expertise</label>
          <div style="display: flex; align-items: center;">
            <input type="text" id="otherExpertise" v-model="formData.otherExpertiseInput" class="form-control mb-3"
              placeholder="Enter your expertise" />
            <button type="button" @click="addCustomExpertise" style="margin-left: 10px;">✔️</button>
          </div>
        </div>
      </div>

      <!-- Description Field -->
      <div class="mb-3">
        <label for="description" class="form-label">Description</label>
        <textarea id="description" v-model="profile.description" class="form-control" rows="4"
          placeholder="Write something about yourself..."></textarea>
      </div>

      <!-- Submit Button -->
      <button type="submit" class="btn">Save Changes</button>
    </form>
  </div>
</template>


<script>
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';
import { storage, db, auth } from '../main';
import { onAuthStateChanged } from 'firebase/auth';

export default {
  data() {
    return {
      profile: {
        name: Cookies.get('username'),
        userType: '',
        experience: '',
        description: '',
        imageUrl: '',
      },
      formData: {
        expertise: [], // For displaying selected expertise as pills
        otherChecked: false,
        otherExpertiseInput: "", // Input for custom expertise
        otherExpertise: "", // Final custom expertise
      },
      profilePicFile: null,
      availableExpertise: [
        "Home Appliances (e.g Microwaves, Standing Fans)",
        "Electrical Fixtures (e.g Lighting, Wiring)",
        "Electronics Repair (e.g Devices, TVs)",
        "Plumbing (e.g Toilets, Heaters)",
        "Air Conditioners (e.g Repairing, Maintaining)",
        "Furnitures (e.g Shelves, Tables)",
        "Windows and Doors (e.g Locks, Window Frames)",
        "Automative Repairs (e.g Tires, Brakes)",
        "Others"
      ],

    };
  },
  methods: {
    onFileChange(event) {
      this.profilePicFile = event.target.files[0];
    },
    createObjectURL(file) {
      return window.URL.createObjectURL(file);
    },
    toggleExpertise(expertise) {
      if (expertise === "Others") {
        this.formData.otherChecked = !this.formData.otherChecked;
      } else if (this.formData.expertise.includes(expertise)) {
        // Remove expertise if it's already selected
        this.formData.expertise = this.formData.expertise.filter(item => item !== expertise);
      } else {
        // Add expertise to the selected list
        this.formData.expertise.push(expertise);
      }
    },
    removeExpertise(expertise) {
      this.formData.expertise = this.formData.expertise.filter(item => item !== expertise);
      if (expertise === this.formData.otherExpertise) {
        this.formData.otherChecked = false;
        this.formData.otherExpertise = "";
      }
    },
    addCustomExpertise() {
      if (this.formData.otherExpertiseInput.trim()) {
        this.formData.otherExpertise = this.formData.otherExpertiseInput.trim();
        this.formData.expertise.push(this.formData.otherExpertise);
        this.formData.otherExpertiseInput = ""; // Clear input after adding
      }
    },
    async updateProfile() {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User is not authenticated.');
        }
        const userId = user.uid;

        // Prepare expertise data, including custom expertise
        let cleanedExpertise = Array.from(
          new Set(this.formData.expertise.map(expertise =>
            expertise.replace(/\s*\(.*?\)/, '').trim()
          ))
        );

        // Upload profile picture if a new one is selected
        if (this.profilePicFile) {
          const profilePicRef = storageRef(storage, `profile_pics/${userId}.jpg`);
          await uploadBytes(profilePicRef, this.profilePicFile);
          this.profile.imageUrl = await getDownloadURL(profilePicRef);
        }

        // Prepare fields to update
        const updatedProfile = {
          name: this.profile.name,
          userType: this.profile.userType,
          expertise: cleanedExpertise,
          description: this.profile.description,
          imageUrl: this.profile.imageUrl,
        };

        // Include experience if the user is a repairer
        if (this.profile.userType === 'repairer' && this.profile.experience) {
          updatedProfile.experience = this.profile.experience;
        }

        // Update Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updatedProfile);

        console.log('Profile updated successfully');
        this.showNotification('Profile updated', 'alert');
        await this.fetchUserProfile(userId);

        // Redirect to the view profile page with user ID after saving
        this.$router.push({ name: 'viewProfile', params: { id: userId } });
      } catch (error) {
        console.error('Error updating profile:', error.message);
      }
    },
    async fetchUserProfile(uid) {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const storedExpertise = userData.expertise || [];

          // Load profile data
          this.profile = {
            ...this.profile,
            name: userData.name,
            userType: userData.userType,
            experience: userData.experience || '',
            description: userData.description || '',
            imageUrl: userData.imageUrl || ''
          };

          // Map stored expertise to include parentheses if in availableExpertise
          this.formData.expertise = storedExpertise.map(item => {
            return this.availableExpertise.find(e => e.startsWith(item)) || item;
          });
          if (userData.otherExpertise) {
            this.formData.otherChecked = true;
            this.formData.otherExpertise = userData.otherExpertise;
          }
        } else {
          console.error('No user data found!');
        }
      } catch (error) {
        console.error('Error fetching profile:', error.message);
      } finally {

      }
    },

    showNotification(message, type) {
      const notification = {
        type: type,
        message: message,
        timestamp: new Date().toISOString(),
        isVisible: true,
      };
      this.$store.dispatch('addNotification', notification);
    },
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.fetchUserProfile(user.uid);
      } else {
        console.error('User is not logged in');
        // window.location.href = '../login.html'; // Redirect to login if not authenticated
      }
    });
  }

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

.btn {
  padding: 8px 25px;
  font-size: 0.9em;
  border-radius: 15px;
  cursor: pointer;
  border: none;
  transition: background-color 0.3s;
  background-color: black;
  color: white;

}

.btn:hover {
  background-color: #085C44;
}


/*expertise styles*/
.selected-expertise-pill {
  display: inline-block;
  background-color: #085C44;
  color: #fffcfc;
  border-radius: 12px;
  padding: 10px 15px;
  margin: 5px;
  font-size: 14px;
  /* Same font size as available expertise pills */
  cursor: pointer;
  border-radius: 20px;
}

.selected-expertise-pill .remove-expertise {
  font-weight: bold;
  color: red;
  /* Red color for the "X" */
  margin-left: 10px;
  cursor: pointer;
}

.expertise-pill {
  display: inline-block;
  background-color: #f2f2f2;
  /* Light background for available expertise */
  color: #333;
  border-radius: 12px;
  padding: 5px 15px;
  margin: 5px;
  font-size: 14px;
  cursor: pointer;
}

.expertise-pill:hover {
  background-color: #ddd;
  /* Change color on hover */
}

#expertiseOptions {
  margin-top: 10px;
  margin-bottom: 10px;
}

#selectedExpertise {
  margin-bottom: 20px;
}

.remove-expertise {
  cursor: pointer;
}

.profile-container {
  max-width: 600px;
  margin: auto;
}

.text-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 
.spinner-border {
  width: 3rem;
  height: 3rem;
  border-width: 0.3rem;
}

.spinner-border.text-primary {
  color: #007bff;
  /* Bootstrap's primary blue color */
</style>
