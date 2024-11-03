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
                "Home Appliances (e.g Microwaves, Washing Machines, etc.)",
                "Electrical Systems and Fixtures (e.g Lighting, Wiring, etc.)",
                "Electronics Repair (e.g Devices, TVs, etc.)",
                "Plumbing (e.g Toilets, Heaters, etc.)",
                "Air Conditioners (e.g Repairing, Maintaining, etc.)",
                "Furnitures (e.g Shelves, Tables, etc.)",
                "Windows and Doors (e.g Locks, Window Frames, etc.)",
                "Automative Repairs (e.g Tires, Brakes, etc.)"
            ]
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

        // Remove parentheses from each expertise item for storage in Firebase
        let cleanedExpertise = Array.from(
          new Set(this.profile.expertise.map(expertise => 
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
          expertise: cleanedExpertise, // Use cleaned expertise here
          description: this.profile.description,
          imageUrl: this.profile.imageUrl,
        };

        // Only include experience if the user is a repairer
        if (this.profile.userType === 'repairer' && this.profile.experience) {
          updatedProfile.experience = this.profile.experience;
        }

        // Update Firestore
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, updatedProfile);

        console.log('Profile updated successfully');
        alert('Profile updated');
        await this.fetchUserProfile(userId);

        // Emit the updated profile info to other components
        const event = new CustomEvent('profileUpdated', {
          detail: {
            username: this.profile.name,
            profileImage: this.profile.imageUrl,
          },
        });
        window.dispatchEvent(event);

      } catch (error) {
        console.error('Error updating profile:', error.message);
      }
    },

    async fetchUserProfile(uid) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Transform the stored expertise to match expertiseList items with parentheses
        const storedExpertise = userData.expertise || [];
        const expertiseWithParentheses = storedExpertise.map((item) => {
          // Find a matching item in the expertiseList
          const matchedExpertise = this.expertiseList.find((expertise) =>
            expertise.startsWith(item.trim())
          );
          return matchedExpertise || item; // If no match found, fallback to item itself
        });

        // Load profile data, including expertise with parentheses for checkbox display
        this.profile = {
          ...this.profile,
          name: userData.name,
          userType: userData.userType,
          experience: userData.experience || '',
          description: userData.description || '',
          expertise: Array.from(new Set(expertiseWithParentheses)), // Ensure unique expertise
          otherChecked: userData.otherExpertise ? true : false,
          otherExpertise: userData.otherExpertise || '',
          imageUrl: userData.imageUrl || ''
        };
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
