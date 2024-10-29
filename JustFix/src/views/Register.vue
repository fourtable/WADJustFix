<template>
    <div class="container-fluid" id="register">
        <div class="row h-100">
            <!-- Left Section with Background -->
            <div class="col-lg-6 col-md-6 left-section d-none d-md-flex">
                <!-- You can add content here if needed -->
            </div>

            <!-- Right Section with the register form -->
            <div class="col-lg-6 col-md-6 register-section">
                <div class="form-card" style="width: 100%; max-width: 400px;">
                    <!-- Show options to choose registration type -->
                    <div v-if="!selectedType">
                        <h2>Choose a Registration Type</h2>
                        <div class="choice-card" @click="selectType('repairer')">
                            Register as a Repairer
                        </div>
                        <div class="choice-card" @click="selectType('user')">
                            Register as a User
                        </div>
                    </div>

                    <!-- Dynamic form content -->
                    <div class="form-card" v-if="selectedType">
                        <h4 v-if="selectedType === 'repairer'">Register as a Repairer</h4>
                        <h4 v-if="selectedType === 'user'">Register as a User</h4>

                        <!-- Repairer Registration Form -->
                        <form v-if="selectedType === 'repairer'" class="form-wrapper" style="width: 100%;" @submit.prevent="submitRepairerForm">
                            <div class="mb-3">
                                <label for="name">Name</label>
                                <input type="text" id="name" v-model="formData.name" placeholder="Enter your Name" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="email">Email</label>
                                <input type="text" id="email" v-model="formData.email" placeholder="Enter your Email" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="experience">Years of Experience</label>
                                <select id="experience" v-model="formData.experience" class="form-control">
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
                                        <input class="form-check-input" type="checkbox" :id="'expertise_' + index" :value="expertise" v-model="formData.expertise">
                                        <label class="form-check-label" :for="'expertise_' + index">{{ expertise }}</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="other" v-model="formData.otherChecked">
                                        <label class="form-check-label" for="other">Others (please specify)</label>
                                        <input v-if="formData.otherChecked" type="text" v-model="formData.otherExpertise" class="form-control mt-2" placeholder="Enter your expertise">
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="businessLocation">Business Location</label>
                                <input type="text" id="businessLocation" ref="businessLocationInput" v-model="formData.businessLocation.address" class="form-control" placeholder="Enter your business location" required>
                            </div>
                            <div class="mb-3">
                                <label for="password">Password</label>
                                <input type="password" id="password" v-model="formData.password" placeholder="Enter your password" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="cfmPassword">Confirm Password</label>
                                <input type="password" id="cfmPassword" v-model="formData.cfmPassword" placeholder="Confirm your password" class="form-control" required>
                            </div>

                            <button type="submit" class="btn mt-3">Register</button>
                        </form>

                        <!-- User Registration Form -->
                        <form v-if="selectedType === 'user'" class="form-wrapper" style="width: 100%;" @submit.prevent="submitUserForm">
                            <div class="mb-3">
                                <label for="name">Name</label>
                                <input type="text" id="name" v-model="formData.name" placeholder="Enter your Name" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="email">Email</label>
                                <input type="email" id="email" v-model="formData.email" placeholder="Enter your email" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="password">Password</label>
                                <input type="password" id="password" v-model="formData.password" placeholder="Enter your password" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="cfmPassword">Confirm Password</label>
                                <input type="password" id="cfmPassword" v-model="formData.cfmPassword" placeholder="Confirm your password" class="form-control" required>
                            </div>
                            <button type="submit" class="btn mt-3">Register</button>
                        </form>

                        <button @click="selectedType = ''" class="btn mt-3">Go Back</button>
                    </div>

                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { auth, db } from '../main.js';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

export default {
    data() {
        return {
            selectedType: '',
            formData: {
                name: '',
                email: '',
                password: '',
                cfmPassword: '',
                experience: '',
                expertise: [],
                otherChecked: false,
                otherExpertise: '',
                businessLocation: {
                    address: '',
                    lat: null,
                    lng: null
                }
            },
            expertiseList: [
                "Home Appliances (e.g, Microwaves, Ovens, etc.)",
                "Devices (e.g, Phones, Computers, etc.)",
                "Networking Devices (e.g, Routers, Modems, etc.)",
                "Photography Equipment (e.g, Cameras, Drones, etc.)",
                "Audio/Visual Equipment (e.g, Speakers, Projectors, etc.)",
                "Printers and Scanners (e.g, Inkjet, Printer, etc.)"
            ]
        };
    },
    methods: {
        selectType(type) {
            this.selectedType = type;
            // Ensure the autocomplete is initialized after the form is displayed
            this.$nextTick(() => {
                if (type === 'repairer') {
                    this.initializeAutocomplete();
                }
            });
        },
        initializeAutocomplete() {
            const input = this.$refs.businessLocationInput;
            if (input) {
                const autocomplete = new google.maps.places.Autocomplete(input);
                autocomplete.setComponentRestrictions({ 'country': ['sg'] });
                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.geometry) {
                        const formattedAddress = place.formatted_address || input.value;
                        const location = place.geometry.location;

                        // Store the address, latitude, and longitude
                        this.formData.businessLocation = {
                            address: formattedAddress, 
                            lat: location.lat(),
                            lng: location.lng()
                        };

                        console.log('Selected place:', place);
                        console.log('Formatted address:', formattedAddress);
                        console.log('Coordinates:', location.lat(), location.lng());
                    } else {
                        console.error('No geometry available for this place.');
                        alert('Please select a valid business location from the suggestions.');
                    }
                });
            } else {
                console.error('Input element not found for Google Autocomplete');
            }
        },
        async submitRepairerForm() {
            try {
                // Check if passwords match
                if (this.formData.password !== this.formData.cfmPassword) {
                    alert('Passwords do not match!');
                    return;
                }

                // Check if business location is populated
                if (!this.formData.businessLocation.address) {
                    alert('Please enter a valid business location.');
                    return;
                }

                // Register the user with Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, this.formData.email, this.formData.password);
                const user = userCredential.user;

                // Prepare selected expertise data
                const selectedExpertise = [...this.formData.expertise];
                if (this.formData.otherChecked && this.formData.otherExpertise) {
                    selectedExpertise.push(this.formData.otherExpertise);
                }

                // Save additional user data in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: this.formData.name,
                    email: this.formData.email,
                    userType: 'repairer',
                    experience: this.formData.experience,
                    expertise: selectedExpertise,
                    businessLocation: this.formData.businessLocation,
                    createdAt: new Date(),
                });

                alert('Registration successful!');
                // Reset form after successful registration
                this.resetForm();
            } catch (error) {
                console.error('Error during registration:', error);
                alert('Error during registration: ' + error.message);
            }
        },
        async submitUserForm() {
            try {
                // Check if passwords match
                if (this.formData.password !== this.formData.cfmPassword) {
                    alert('Passwords do not match!');
                    return;
                }

                // Register the user with Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, this.formData.email, this.formData.password);
                const user = userCredential.user;

                // Save additional user data in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: this.formData.name,
                    email: this.formData.email,
                    userType: 'user',
                    createdAt: new Date(),
                });

                alert('Registration successful!');
                // Reset form after successful registration
                this.resetForm();
            } catch (error) {
                console.error('Error during registration:', error);
                alert('Error during registration: ' + error.message);
            }
        },
        resetForm() {
            this.formData = {
                name: '',
                email: '',
                password: '',
                cfmPassword: '',
                experience: '',
                expertise: [],
                otherChecked: false,
                otherExpertise: '',
                businessLocation: {
                    address: '',
                    lat: null,
                    lng: null
                }
            };
            this.selectedType = '';
        }
    }
};
</script>

<style scoped>
/* Your CSS styles from the original HTML can be placed here */
.container-fluid {
    padding: 0;
}

.left-section {
    background: url('/path/to/your/background-image.jpg') no-repeat center center fixed;
    background-size: cover;
}

.register-section {
    display: flex;
    justify-content: center;
    align-items: center;
}

.form-card {
    padding: 20px;
    border-radius: 5px;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.choice-card {
    margin: 10px 0;
    padding: 10px;
    border: 1px solid #007bff;
    border-radius: 5px;
    text-align: center;
    cursor: pointer;
}

.choice-card:hover {
    background-color: #007bff;
    color: #fff;
}

.btn {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
}

.btn:hover {
    background-color: #0056b3;
}
</style>
