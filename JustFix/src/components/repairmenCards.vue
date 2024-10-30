<script setup>
import { ref, computed } from 'vue';
import defaultProfilePic from '../assets/profile.jpg';
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';

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

const clearSelected = () => {
    selectedRepairmen.value = []; // Clear the selected repairmen
    console.log("Cleared selected repairmen");
};


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



//select and filter Exepertise logic
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

// Computed property to filter repairmen based on selected expertise
const filteredRepairmen = computed(() => {
    if (selectedExpertise.value.length === 0 || selectedExpertise.value.includes("All")) {
        return props.repairmen;
    }
    return props.repairmen.filter(repairman => {
        return repairman.expertise.some(skill => selectedExpertise.value.includes(skill));
    });
});

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

    <div class="container repairmen-container">
        <p class="section-title">Browse Our Most Trusted Handymen</p>

        <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end;">
            <button @click="requestQuote" :disabled="selectedRepairmen.length === 0" class="hero-button">Request a Quote</button>
            <span @click="clearSelected" class="clear-link"
                style="text-decoration: underline; cursor: pointer; margin-top: 8px; padding-right: 14px;">
                Clear Selected Repairmen
            </span>
        </div>
    </div>
    <!-- Expertise Pills -->
    <div class="expertise-pills py-4">
        <button v-for="expertise in expertiseOptions" :key="expertise"
            :class="['expertise-pill', { selected: selectedExpertise.includes(expertise) }]"
            @click="toggleExpertise(expertise)">
            {{ expertise }}
        </button>
        <button class="clear-button" @click="clearSelections">Clear</button>
    </div>


    <div class="row justify-content-center gx-4" style="padding:0; margin:0;">
        <div class="col-lg-3 col-md-4 col-sm-6 custom-col mb-0" v-for="repairman in filteredRepairmen"
            :key="repairman.id">
            <div class="card text-center shadow-sm clickable-card" style="padding: 0; border-radius: 20px;"
                @click="toggleSelection(repairman.id)" :class="{ selected: selectedRepairmen.includes(repairman.id) }">
                <img :src="repairman.profilePic || defaultProfilePic" class="card-img-top" alt="Profile Picture"
                    height="200px" style="object-fit: cover; border-radius: 20px;">
                <div class="checkbox-container">
                    <input type="checkbox" class="custom-checkbox" @click.stop="toggleSelection(repairman.id)"
                        :checked="isSelected(repairman.id)" />
                </div>
                <div class="card-body text-start position-relative">
                    <div class="d-flex justify-content-between">
                        <h5 class="card-title mb-1 text-center pb-2" style="font-weight:bold;">
                            {{ repairman.username || repairman.name }}
                        </h5>
                        <p class="text-muted mb-1">
                            <span class="star-icon">★</span>
                            5.0 (123)
                        </p>
                    </div>
                    <p class="card-description text-muted" style="font-size: 0.9rem;">
                        {{ truncateDescription(repairman.description) }}
                    </p>
                    <ul class="list-unstyled">
                        <li v-for="(skill, index) in topSkills(repairman.expertise)" :key="index" class="skill-pill">
                            {{ skill }}
                        </li>
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
    transition: transform 0.3s, background-color 0.3s;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e1e1;
    cursor: pointer;
}

.card:hover {
    transform: translateY(-5px);
    background-color: #f0f0f0;
}

.selected {
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
</style>
