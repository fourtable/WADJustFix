<style lang="css">
@import '../../src/styles.css';
</style>

<template>
    <div id="register">
        <div class="full-height">
            <!-- Left Section with Background -->
            <div class="left-section">
                <img src="../assets/samsung-memory-fxKvHGDICcQ-unsplash.jpg" alt="image of aircon servicing"
                    class="full-height-image" />
            </div>
            <!-- Right Section with the register form -->
            <div class="right-section" style="margin-bottom: 30%;">
                <div style="width: 100%; height:80%; max-width: 500px;">
                    <!-- Show options to choose registration type -->
                    <div v-if="!selectedType" style="margin-top: 220px; ">
                        <h2>What type of user are you?</h2>
                        <div class="choice-card btn" @click="selectType('repairer')">
                            Fixer
                        </div>
                        <div class="choice-card btn" @click="selectType('user')">
                            Client
                        </div>
                    </div>
                    <!-- Dynamic form content -->
                    <div v-if="selectedType">
                        <h4 v-if="selectedType === 'repairer'">
                            Register as a Repairer</h4>
                        <h4 v-if="selectedType === 'user'" style="margin-top: 75px; ">Register as a User</h4>
                        <!-- Repairer Registration Form -->
                        <form v-if="selectedType === 'repairer'" class="form-wrapper" style="width: 100%;"
                            @submit.prevent="submitRepairerForm">
                            <div class="mb-3">
                                <!-- <label for="name">Name</label> -->
                                <input type="text" id="name" v-model="formData.name" placeholder="First Name"
                                    class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <!-- <label for="email">Email</label> -->
                                <input type="email" id="email" v-model="formData.email" placeholder="Email Address"
                                    class="form-control" required />
                            </div>

                            <div>
                                <label>Area of Expertise</label>
                                <!-- Display selected expertise pills -->
                                <div id="selectedExpertise">
                                    <div v-for="(expertise, index) in formData.expertise" :key="index"
                                        class="selected-expertise-pill">
                                        {{ expertise }}
                                        <span @click="removeExpertise(expertise)" class="remove-expertise">X</span>
                                    </div>
                                </div>
                                <!-- Display available expertise options -->
                                <div id="expertiseOptions">
                                    <div v-for="(expertise, index) in availableExpertise" :key="index"
                                        class="expertise-pill" @click="toggleExpertise(expertise)">
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
                                        <input type="text" id="otherExpertise" v-model="formData.otherExpertiseInput"
                                            class="form-control mb-3" placeholder="Enter your expertise" required />
                                        <button type="button" @click="addCustomExpertise"
                                            style="margin-left: 10px;">✔️</button>
                                    </div>
                                </div>

                            </div>

                            <div class="mb-3">
                                <label for="businessLocation">Business Location</label>
                                <input type="text" id="businessLocation" ref="businessLocationInput"
                                    v-model="formData.businessLocation.address" class="form-control"
                                    placeholder="Enter your business location" required>
                            </div>
                            <div class="mb-3">
                                <!-- <label for="password">Password</label> -->
                                <input type="password" id="password" v-model="formData.password" placeholder="Password"
                                    class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <!-- <label for="cfmPassword">Confirm Password</label> -->
                                <input type="password" id="cfmPassword" v-model="formData.cfmPassword"
                                    placeholder="Confirm password" class="form-control" required />
                            </div>

                            <button type="submit" class="btn px-5 py-3 mb-2">Register</button>
                        </form>
                        
                        <!-- User Registration Form -->
                        <form v-if="selectedType === 'user'" class="form-wrapper" style="width: 100%;"
                            @submit.prevent="submitUserForm">
                            <div class="mb-3">
                                <label for="name">Name</label>
                                <input type="text" id="name" v-model="formData.name" placeholder="Enter your Name"
                                    class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label for="email">Email</label>
                                <input type="email" id="email" v-model="formData.email" placeholder="Enter your email"
                                    class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label for="password">Password</label>
                                <input type="password" id="password" v-model="formData.password"
                                    placeholder="Enter your password" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label for="cfmPassword">Confirm Password</label>
                                <input type="password" id="cfmPassword" v-model="formData.cfmPassword"
                                    placeholder="Confirm your password" class="form-control" required />
                            </div>
                            <button type="submit" class="btn px-5 py-3 mb-2 mt-3">Register</button>
                        </form>

                        <button @click="selectedType = ''" class="btn px-5 py-3">Go Back</button>
                        <!-- <div v-if="selectedType === 'repairer'" class="mb-5"></div> -->
                        <br>
                        <br>
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
                registrationDate: new Date().toISOString(),

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
                "Home Appliances (e.g Microwaves, Standing Fans)",
                "Electrical Fixtures (e.g Lighting, Wiring)",
                "Electronics Repair (e.g Devices, TVs)",
                "Plumbing (e.g Toilets, Heaters)",
                "Air Conditioners (e.g Repairing, Maintaining)",
                "Furnitures (e.g Shelves, Tables)",
                "Windows and Doors (e.g Locks, Window Frames)",
                "Automative Repairs (e.g Tires, Brakes)",
                "Others"
            ]
        };
    },
    watch: {
        'formData.otherExpertise'(newExpertise) {
            if (newExpertise && !this.formData.expertise.includes(newExpertise)) {
                this.formData.expertise.push(newExpertise);
            }
        }
    },
    computed: {
        availableExpertise() {
            return this.expertiseList.filter((expertise) => !this.formData.expertise.includes(expertise));
        },
    },
    methods: {
        toggleExpertise(expertise) {
            if (expertise === "Others") {
                this.formData.otherChecked = !this.formData.otherChecked;

                // Clear custom expertise if "Others" is unchecked
                if (!this.formData.otherChecked) {
                    const index = this.formData.expertise.indexOf(this.formData.otherExpertise);
                    if (index > -1) this.formData.expertise.splice(index, 1);
                    this.formData.otherExpertise = '';
                }
            } else {
                // Add or remove the selected expertise
                const index = this.formData.expertise.indexOf(expertise);
                if (index > -1) {
                    this.formData.expertise.splice(index, 1);
                } else {
                    this.formData.expertise.push(expertise);
                }
            }
        },
        addCustomExpertise() {
            console.log("addCustomExpertise called");

            const expertiseInput = this.formData.otherExpertiseInput.trim();
            if (expertiseInput) {
                this.formData.expertise.push(expertiseInput);
                this.formData.otherExpertiseInput = ''; // Clear the input field
                this.showCustomInput = false; // Hide the input field
                console.log('Input:', expertiseInput);
                console.log('Expertise array before push:', this.formData.expertise);
            }
        },
        removeExpertise(index) {
            this.formData.expertise.splice(index, 1);

            // Uncheck "Others" checkbox if the removed item is the custom expertise
            if (this.formData.expertise[index] === this.formData.otherExpertise) {
                this.formData.otherChecked = false;
                this.formData.otherExpertise = '';
            }
        },

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
                autocomplete.setComponentRestrictions({ 'country': ['sg'] }); // Restrict to Singapore
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

                // Prepare selected expertise data and remove text within parentheses
                let selectedExpertise = this.formData.expertise.map(expertise => {
                    return expertise.replace(/\s*\(.*?\)/, '').trim(); // Removes text in parentheses
                });

                // Add the "other" expertise if specified
                if (this.formData.otherChecked && this.formData.otherExpertise) {
                    selectedExpertise.push(this.formData.otherExpertise);
                }

                // Save additional user data in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: this.formData.name,
                    email: this.formData.email,
                    userType: 'repairer',
                    expertise: selectedExpertise,
                    businessLocation: this.formData.businessLocation,
                    createdAt: new Date(),
                    lastLogin: new Date(),
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
                    lastLogin: new Date(),
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
.full-height {
    height: 97vh;
    display: flex;
    overflow: hidden;
    width: 100vw;
}

.full-height-image {
    width: 110%;
    height: 97vh;
    object-fit: cover;
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
    border-radius: 5px;
    text-align: center;
    cursor: pointer;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
}

.extra-fixer-margin {
    margin-top: 500px;
}

@media (max-width: 1478px) and (min-width: 768px) {
    .extra-fixer-margin {
        margin-top: 200px;
    }
} 
@media (max-width: 996px) and (min-width: 768px) {
    .extra-fixer-margin {
        margin-top: 500px;
    }
}
@media (max-width: 767px) and (min-width: 400px) {
    .extra-fixer-margin {
        margin-top: 250px;
    }
}


.choice-card:hover {
    transform: scale(1.05);
}

.form-control {
    border-radius: 20px;
    padding: 10px;
}

.btn {
    color: white;
    padding: 100px 80px;
    border-radius: 5px;
    cursor: pointer;
}

.selected-expertise-pill {
    display: inline-block;
    background-color: #085C44;
    /* Light gray background */
    color: #fffcfc;
    /* Dark text color */
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

.btn-pill {
    padding: 8px 15px;
    margin-right: 5px;
    background-color: #f1f1f1;
    color: #333;
    border-radius: 25px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.btn-pill.active {
    background-color: #007bff;
    color: white;
}

.btn-pill:hover {
    background-color: #0056b3;
    color: white;
}

.form-check-input {
    margin-right: 10px;
}

.form-control {
    border-radius: 20px;
    padding: 10px;
}
</style>
