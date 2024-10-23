<template>
    <div class="profile-container">
        <h2>Edit Profile</h2>
        <form @submit.prevent="updateProfile">
            <div class="mb-3">
                <label for="profilePic" class="form-label">Profile Picture</label>
                <input type="file" class="form-control" id="profilePic" @change="onFileChange">
                <div v-if="profile.imageUrl">
                    <img :src="profile.imageUrl" alt="Profile Pic Preview" 
                        style="max-width: 150px; margin-top: 10px;">
                </div>
            </div>
            <div class="mb-3">
                <label for="name" class="form-label">Name</label>
                <input type="text" class="form-control" id="name" v-model="profile.name" value=""  required>
            </div>

            <div v-if="profile.userType === 'repairer'">
                <div class="mb-3">
                    <label for="experience">Years of Experience</label>
                    <select id="experience" v-model="profile.experience" class="form-control">
                        <option value="" disabled>Select</option>
                        <option value="0">Less than 1 year</option>
                        <option value="1">1-3 years</option>
                        <option value="2">3-5 years</option>
                        <option value="4">More than 5 years</option>
                    </select>
                </div>
                <div class="mb-3">
                    <label>Area of Expertise</label>
                    <div id="expertiseOptions">
                        <div v-for="(expertise, index) in expertiseList" :key="index" class="form-check">
                            <input class="form-check-input" type="checkbox" :id="'expertise_' + index"
                                :value="expertise" v-model="profile.expertise">
                            <label class="form-check-label" :for="'expertise_' + index">{{ expertise }}</label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="other" v-model="profile.otherChecked">
                            <label class="form-check-label" for="other">Others (please specify)</label>
                            <input v-if="profile.otherChecked" type="text" v-model="profile.otherExpertise"
                                class="form-control mt-2" placeholder="Enter your expertise">
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea id="description" v-model="profile.description" class="form-control" rows="4"
                    placeholder="Write something about yourself..."></textarea>
            </div>

            <button type="submit" class="btn btn-primary">Save Changes</button>
        </form>
    </div>
</template>

<script>
import { firebaseApp, db, storage} from '../main'; 
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Cookies from 'js-cookie';


export default {
    data() {
        return {
            profile: {
                name: Cookies.get('username'),
                userType: '',
                experience: '',
                expertise: [],
                description: '',
                otherChecked: false,
                otherExpertise: '',
                imageUrl: ''
            },
            profilePicFile: null,
            expertiseList: ['Plumbing', 'Electrical', 'Carpentry', 'Painting'],
        };
    },
    methods: {
        onFileChange(event) {
            this.profilePicFile = event.target.files[0];
        },
        async updateProfile() {
            try {
                const userId = Cookies.get('uid'); // Replace with the logged-in user's ID

                if (this.profilePicFile) {
                    const profilePicRef = ref(storage, `profile_pics/${userId}.jpg`);

                    // Upload the file
                    await uploadBytes(profilePicRef, this.profilePicFile);

                    // Get the download URL
                    this.profile.imageUrl = await getDownloadURL(profilePicRef);
                }

                // Update Firestore document
                const userRef = doc(db, 'users', userId);
                await updateDoc(userRef, {
                    name: this.profile.name,
                    userType: this.profile.userType,
                    experience: this.profile.experience,
                    expertise: this.profile.expertise,
                    description: this.profile.description,
                    imageUrl: this.profile.imageUrl // Include imageUrl if it was updated
                });

                console.log("Profile updated:", this.profile);
                await this.fetchUserProfile();
            } catch (error) {
                console.error("Error updating profile:", error);
            }
        },
        async fetchUserProfile() {
            const userId = "YOUR_USER_ID"; // Replace with the logged-in user's ID
            const userDoc = await getDoc(doc(db, 'users', userId));

            if (userDoc.exists()) {
                this.profile = { ...userDoc.data() };
            }
        }
    },
    mounted() {
        this.fetchUserProfile();
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
</style>
