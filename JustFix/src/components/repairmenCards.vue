<script setup>
import { ref, computed } from 'vue';
import defaultProfilePic from '../assets/profile.jpg';
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';
import quoteListPopup from './quoteListPopup.vue';
import Cookies from 'js-cookie';

const props = defineProps({
    repairmen: {
        type: Array,
        required: true
    },
    repairName: '',
    repairerPic: ''
});

// Router instance
const router = useRouter();
// const isQuotesListPopupVisible = ref(false);

// Toggle the selected repairman
const selectedRepairmen = ref([]);
const toggleSelection = (repairmanId) => {
    if (selectedRepairmen.value.includes(repairmanId)) {
        selectedRepairmen.value = selectedRepairmen.value.filter(id => id !== repairmanId);
    } else {
        selectedRepairmen.value.push(repairmanId);
    }
    console.log("Selected repairmen:", selectedRepairmen.value);
};

const isQuotesListPopupVisible = ref(false); // State for controlling visibility

const closeModal = () => {
    console.log("Modal closed");
    isQuotesListPopupVisible.value = false; // This should control the visibility of the modal
};

const openQuotesListPopup = () => {
    const uid = Cookies.get('uid') || sessionStorage.getItem('uid')
    if(uid){
        isQuotesListPopupVisible.value = true; // Set visibility to true when the button is clicked
    }
    else{
        router.push({
        name: 'login'
    });
    }
};

const clearSelected = () => {
    selectedRepairmen.value = []; // Clear the selected repairmen
    console.log("Cleared selected repairmen");
};
// Computed property to get full repairman objects based on selected IDs
const selectedRepairmenDetails = computed(() => {
    return props.repairmen.filter(repairman => selectedRepairmen.value.includes(repairman.id));
});

const topSkills = (expertise) => expertise.slice(0, 3);

const truncateDescription = (description, maxLength = 100) => {
    if (!description) return '';
    return description.length <= maxLength ? description : description.slice(0, maxLength) + '...';
};

const requestQuote = () => {
    if (selectedRepairmen.value.length === 0) {
        console.log("No repairmen selected. Please select at least one repairman to request a quote.");
        return; // Prevent navigation if no repairmen are selected
    }

    console.log("Requesting quote for:", selectedRepairmen.value);

    router.push({
        name: 'myQuotes',
        state: { selectedRepairmen: selectedRepairmen.value }
    });
};

// Helper method to check if a repairman is selected
const isSelected = (repairmanId) => selectedRepairmen.value.includes(repairmanId);

// Search functionality
const searchQuery = ref(''); // Step 1: Create a reactive search query

// Computed property to filter repairmen based on selected expertise and search query
const filteredRepairmen = computed(() => {
    return props.repairmen.filter(repairman => {
        const name = repairman.username || repairman.name;
        const expertiseMatch = selectedExpertise.value.length === 0 || selectedExpertise.value.includes("All") || repairman.expertise.some(skill => selectedExpertise.value.includes(skill));
        const searchMatch = name.toLowerCase().includes(searchQuery.value.toLowerCase()); // Step 2: Implement the search logic
        return expertiseMatch && searchMatch;
    });
});

//select and filter Expertise logic
const selectedExpertise = ref([]);

// Available expertise options
const expertiseOptions = ref([
    "Home Appliances",
    "Electrical Fixtures",
    "Plumbing",
    "Air Conditioners",
    "Electronics Repair",
    "Furniture Assembly and Repair",
    "Windows and Doors",
    "Automotive Repairs",
    "Miscellaneous Repairs"
]);

// Toggle expertise selection
const toggleExpertise = (expertise) => {
    if (expertise === "All") {
        selectedExpertise.value = selectedExpertise.value.includes("All") ? [] : ["All"];
    } else {
        if (selectedExpertise.value.includes(expertise)) {
            selectedExpertise.value = selectedExpertise.value.filter(item => item !== expertise);
        } else {
            selectedExpertise.value.push(expertise);
        }
    }
};

// Clear all selections
const clearSelections = () => {
    selectedExpertise.value = [];
};
</script>

<template>
    <!-- New Section for Selected Repairmen -->

    <div v-if="selectedRepairmen.length > 0" class="selected-repairmen-section">
        <!-- <h3>Selected Repairmen</h3> -->
        <!-- <button @click="clearSelected" class="btn btn-danger">Clear Selected Repairmen</button> -->

        <div class="container repairmen-container">
            <p class="section-title">Your Selected Repairmen</p>
            <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end;">
                <button @click="openQuotesListPopup" :disabled="selectedRepairmen.length === 0"
                    class="hero-button">Send Quote</button>
                <quoteListPopup v-if="isQuotesListPopupVisible" :selectedRepairmen="selectedRepairmen" @close="closeModal" />
                <span @click="clearSelected" class="clear-link"
                    style="text-decoration: underline; cursor: pointer; margin-top: 8px; padding-right: 14px;">
                    Clear Selected Repairmen
                </span>
            </div>
        </div>
        <div class="row justify-content-center gx-4 mt-3 mb-3">
            <div class="col-lg-3 col-md-4 col-sm-6 custom-col mb-0" v-for="repairman in selectedRepairmenDetails"
                :key="repairman.id" data-aos="fade-up" data-aos-delay="100">
                <div class="card text-center shadow-sm" style="padding: 0; border-radius: 20px;">
                    <div class="card-header d-flex align-items-center"
                        style="background-color: transparent; border: none;">
                        <input type="checkbox" class="custom-checkbox" @click.stop="toggleSelection(repairman.id)"
                            :checked="isSelected(repairman.id)" style="margin-left: auto;" />
                    </div>
                    <img :src="repairman.profilePic || repairman.imageUrl || defaultProfilePic" class="card-img-top" alt="Profile Picture"
                        height="200px" style="object-fit: cover; border-radius: 20px;">
                    <div class="card-body text-start" data-aos="fade-up" data-aos-delay="200">
                        <h5 class="card-title" style="font-weight: bold;">{{ repairman.username || repairman.name }}
                        </h5>
                        <p class="text-muted mb-1"><span class="star-icon">★</span> 5.0 (123)</p>
                        <p class="card-description">{{ truncateDescription(repairman.description) }}</p>
                        <ul class="list-unstyled">
                            <li v-for="(skill, index) in topSkills(repairman.expertise)" :key="index" class="skill-pill"
                                data-aos="flip-right" data-aos-delay="300">
                                {{ skill }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>


    <div class="container repairmen-container" id="fixer">
        <p class="section-title" data-aos="fade-up">Browse Our Most Trusted Handymen</p>
    </div>

    <!-- Expertise Pills -->
    <div class="expertise-pills py-4" data-aos="fade-up" data-aos-delay="100">
        <button v-for="expertise in expertiseOptions" :key="expertise"
            :class="['expertise-pill', { selected: selectedExpertise.includes(expertise) }]"
            @click="toggleExpertise(expertise)">
            {{ expertise }}
        </button>
        <button class="clear-button" @click="clearSelections">Clear</button>
    </div>

    <!-- Search Bar -->
    <div class="mb-3" data-aos="fade-up" data-aos-delay="200">
        <input type="text" v-model="searchQuery" placeholder="Search Repairers" class="form-control" />
    </div>

    <!-- Original Repairmen Listing -->
    <div class="row justify-content-center gx-4" style="padding:0; margin:0;">
        <div class="col-lg-3 col-md-4 col-sm-6 custom-col mb-0" v-for="repairman in filteredRepairmen"
            :key="repairman.id" data-aos="fade-up" data-aos-delay="100">
            <div class="card text-center shadow-sm clickable-card" style="padding: 0; border-radius: 20px;"
                :class="{ selected: selectedRepairmen.includes(repairman.id) }">
                <div class="card-header d-flex justify-content-end"
                    style="border: none; border-radius: 20px 20px 0 0; margin: 0;">
                    <input type="checkbox" class="custom-checkbox" @change="toggleSelection(repairman.id)"
                        :checked="isSelected(repairman.id)" />
                </div>
                <img :src="repairman.profilePic || repairman.imageUrl || defaultProfilePic" class="card-img-top" alt="Profile Picture"
                    height="200px" style="object-fit: cover; border-radius: 20px;">
                <div class="card-body text-start position-relative" @click="navigateToProfile(repairman.id)"
                    data-aos="fade-up" data-aos-delay="300">
                    <h5 class="card-title mb-1 text-start pb-2" style="font-weight:bold;">{{ repairman.username ||
                        repairman.name }}</h5>
                    <p class="text-muted mb-1"><span class="star-icon">★</span> 5.0 (123)</p>
                    <p class="card-description text-muted" style="font-size: 0.9rem;">{{
                        truncateDescription(repairman.description) }}</p>
                    <ul class="list-unstyled">
                        <li v-for="(skill, index) in topSkills(repairman.expertise)" :key="index" class="skill-pill">{{
                            skill }}</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>



<style scoped>
/* Hero-style button */
.hero-button {
    padding: 12px 24px;
    font-size: 1.25rem;
    font-weight: bold;
    color: #ffffff;
    background-color: #085C44;
    border: none;
    border-radius: 30px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: background-color 0.3s ease;
    cursor: pointer;
}

.hero-button:hover {
    background-color: #064830;
}

/* Custom checkbox container */
.checkbox-container {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Custom styled checkbox */
.custom-checkbox {
    width: 1.5rem;
    height: 1.5rem;
    cursor: pointer;
    accent-color: #085C44;
    border: 2px solid #085C44;
    border-radius: 5px;
}

.card {
    background: #ffffff;
    padding: 20px;
    width: 100%;
    max-width: 40vw;
    border: 0;
    transition: transform 0.3s, background-color 0.3s ease;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e1e1;
    cursor: pointer;
}

.card:hover {
    transform: translateY(-5px);
    background-color: #f0f0f0;
}

.card.selected {
    background-color: #f0f0f0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    transform: translateY(-5px);
}

.selected:hover {
    background-color: #f0f0f0;
    /* Maintain selected color on hover */
}

.card-body {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 270px;
    overflow: hidden;
    text-align: left;
    /* Ensure text is left-aligned */
}

.card-header {
    transition: background-color 0.3s ease;
    background-color: white;
    border: none;
}

.card:hover .card-header,
.card.selected .card-header {
    background-color: #f0f0f0;
    /* Ensure header stays white on hover and selected */
}

/* Additional styling for other elements */
.card-title,
.card-description,
.skill-pill,
.text-muted {
    text-align: left;
    /* Ensure all text elements are left-aligned */
}


ul.list-unstyled {
    padding-left: 0;
    margin-bottom: auto;
}

.skill-pill {
    display: inline-block;
    /* Allows wrapping */
    padding: 4px 8px;
    font-size: 0.8rem;
    border: 1px solid #085C44;
    color: #085C44;
    border-radius: 15px;
    margin-right: 5px;
    margin-bottom: 5px;
    background-color: #ffffff;
    white-space: normal;
    /* Allows wrapping */
    word-wrap: break-word;
    /* Allows long words to break */
    overflow-wrap: break-word;
    /* Ensures wrapping for long words */
}


.star-icon {
    color: #085C44;
}

.repairmen-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-title {
    font-weight: bold;
    font-size: x-large;
    margin: 0;
}

.hero-button {
    padding: 12px 24px;
    font-size: 1.25rem;
    font-weight: bold;
    color: #ffffff;
    background-color: #085C44;
    border: none;
    border-radius: 30px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: background-color 0.3s ease;
    cursor: pointer;
}

.hero-button:hover {
    background-color: #064830;
}


/* Media query for screens 867px and wider */
@media (min-width: 867px) {
    .repairmen-container {
        padding-top: 50px;
        /* Increased padding for wider screens */
    }
}

/* Additional media queries for further increases */
@media (min-width: 1000px) {
    .repairmen-container {
        padding-top: 70px;
        /* Further increased padding */
    }
}

@media (min-width: 1200px) {
    .repairmen-container {
        padding-top: 70px;
        /* Consistent padding for large screens */
    }
}

/* Styles for cards */
.card {
    /* Existing styles */
    width: auto;
    height: 500px;
    /* Allow the card to fill the width */
}

/* For screens 575px and below */
@media (max-width: 575px) {
    .custom-col {
        flex: 1 1 100%;
        /* Make each card take full width */
        display: flex;
        justify-content: center;
        /* Center the cards */
    }

    .card {
        width: 90%;
        /* Card width to fill most of the container */
        max-width: 600px;
        /* Optional: set a max-width for cards */
    }
}

/* For screens 575px and below */
@media (max-width: 575px) {
    .custom-col {
        flex: 1 1 100%;
        /* Make each card take full width */
        display: flex;
        justify-content: center;
        /* Center the cards */
    }

    .card {
        width: 90%;
        /* Card width to fill most of the container */
        max-width: 600px;
        /* Optional: set a max-width for cards */
    }
}

.expertise-pills {
    display: flex;
    overflow-x: auto;
    /* Enable horizontal scrolling */
    padding: 10px 0px;
}

.expertise-pills::-webkit-scrollbar {
    display: none;
}

.expertise-pill {
    padding: 6px 12px;
    /* Reduced padding for smaller pills */
    margin: 0 5px;
    border: 1px solid #085C44;
    border-radius: 15px;
    background-color: white;
    cursor: pointer;
    transition: background-color 0.3s;
    font-size: 0.85rem;
    /* Smaller text size */
}

.expertise-pill.selected {
    background-color: #e0f7e0;
    /* Light green for selected */
}

.clear-button {
    padding: 6px 12px;
    /* Reduced padding for smaller button */
    margin-left: 10px;
    border: none;
    border-radius: 15px;
    background-color: #ff4336;
    /* Red for clear */
    color: white;
    cursor: pointer;
    font-size: 0.85rem;
    /* Smaller text size */
}

.clear-link {
    display: inline-block;
    margin-top: 10px;
    /* Add some spacing above */
    color: #085C44;
    /* Use the same color as the buttons */
    text-decoration: underline;
    /* Underline the text */
    cursor: pointer;
    /* Show pointer on hover */
    font-size: 0.9rem;
    /* Adjust size if needed */
}

.clear-link:hover {
    color: #064830;
    /* Darker shade on hover for feedback */
}

@media (min-width: 992px) {

    /* Adjust as necessary */
    .row {
        height: 80%;
        /* This applies for larger screens */
    }
}

/* For smaller screens */
@media (max-width: 991px) {

    /* Target smaller screens */
    .row {
        height: 90%;
        /* Change to auto for smaller screens */
    }
}

@media (max-width: 576px) {

    /* Target very small screens (like phones) */
    .row {
        height: 99%;
        /* Keep it auto */
    }

}

.popup {
    position: fixed;
    /* or absolute depending on your layout */
    z-index: 9999;
    /* ensure it's on top of other content */
    /* Add other necessary styles */
}
</style>
