<script setup>
import { ref } from 'vue';
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

const selectedRepairmen = ref([]);

// Toggle the selected repairman
const toggleSelection = (repairmanId) => {
    if (selectedRepairmen.value.includes(repairmanId)) {
        selectedRepairmen.value = selectedRepairmen.value.filter(id => id !== repairmanId);
    } else {
        selectedRepairmen.value.push(repairmanId);
    }
    console.log("Selected repairmen:", selectedRepairmen.value);
};

const topSkills = (expertise) => expertise.slice(0, 3);

const truncateDescription = (description, maxLength = 100) => {
    if (!description) return '';
    return description.length <= maxLength ? description : description.slice(0, maxLength) + '...';
};

const requestQuote = () => {
    console.log("Requesting quote for:", selectedRepairmen.value);
};

// Helper method to check if a repairman is selected
const isSelected = (repairmanId) => selectedRepairmen.value.includes(repairmanId);

</script>

<template>


    <div class="container repairmen-container mt-4 d-flex justify-content-between align-items-center">
        <p class="section-title">Browse Our Most Trusted Handymen</p>
        <button @click="requestQuote" class="hero-button">Request a Quote</button>
    </div>



    <div class="row justify-content-center gx-4">
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4 custom-col" v-for="repairman in repairmen" :key="repairman.id">
            <div class="card text-center shadow-sm clickable-card" :class="{ 'selected': isSelected(repairman.id) }"
                @click="toggleSelection(repairman.id)" style="padding:0; border-radius: 20px; cursor: pointer;">


                <img :src="repairman.profilePic || defaultProfilePic" class="card-img-top" alt="Profile Picture"
                    height="200px" style="object-fit: cover; border-radius: 20px;">

                <!-- Custom Checkbox for Multi-Selection -->
                <div class="checkbox-container" @click.stop>
                    <input type="checkbox" class="custom-checkbox" @change="toggleSelection(repairman.id)"
                        :checked="isSelected(repairman.id)">
                </div>

                <div class="card-body">
                    <h5 class="card-title mb-1" style="font-weight:bold;">
                        {{ repairman.username || repairman.name }}
                    </h5>
                    <p class="text-muted mb-1">
                        <span class="star-icon">★</span>
                        5.0 (123)
                    </p>
                    <p class="card-description text-muted">
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
.section-title {
    font-weight: bold;
    font-size: x-large;
    padding-top: 35px;
    padding-bottom: 10px;
}

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

/* Card base styles */
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




/* Hover effect */
.card:hover {
    transform: translateY(-5px);
    background-color: #f0f0f0;
    /* Hover color */
}

/* Selected effect (higher priority than hover) */
.selected {
    background-color: #e8e8e8;
    /* Slightly darker grey for selected */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    /* Slightly deeper shadow on selection */
    transform: translateY(-5px);
    /* Maintain the lifted effect */
}

/* Style for selected hover - no change to transform */
.selected:hover {
    background-color: #e8e8e8;
    /* Maintain selected color */
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

/* Base styles for the container */
.repairmen-container {
    padding-top: 80px;
    /* Increased base padding for more space */
}

/* Media query for screens 867px and wider */
@media (min-width: 867px) {
    .repairmen-container {
        padding-top: 120px;
        /* Increased padding for wider screens */
    }
}

/* Additional media queries for further increases */
@media (min-width: 1000px) {
    .repairmen-container {
        padding-top: 140px;
        /* Further increased padding */
    }
}

@media (min-width: 1200px) {
    .repairmen-container {
        padding-top: 160px;
        /* Even more padding for large screens */
    }
}

/* Styles for cards */
.card {
    /* Existing styles */
    width: auto;
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
</style>
