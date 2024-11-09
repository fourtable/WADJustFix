<script setup>
import { ref, computed } from 'vue';
import defaultProfilePic from '../assets/profile.jpg';
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';
import quoteListPopup from './quoteListPopup.vue';
import Cookies from 'js-cookie';
import { onMounted } from 'vue';
import { db } from "../plugins/firebaseManager";
import { collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.18.0/firebase-firestore.js";
import { watch } from 'vue';


// Load selected repairmen from localStorage when the component mounts
onMounted(() => {
    const savedRepairmen = localStorage.getItem('selectedRepairmen');
    if (savedRepairmen) {
        selectedRepairmen.value = JSON.parse(savedRepairmen);
    }
    fetchRatingsForRepairmen();
});
// Update localStorage whenever the selectedRepairmen changes
const updateLocalStorage = () => {
    localStorage.setItem('selectedRepairmen', JSON.stringify(selectedRepairmen.value));
};

const selectedRepairmen = ref([]);
const toggleSelection = (repairmanId) => {
    if (selectedRepairmen.value.includes(repairmanId)) {
        selectedRepairmen.value = selectedRepairmen.value.filter(id => id !== repairmanId);
    } else {
        selectedRepairmen.value.push(repairmanId);
    }
    updateLocalStorage(); // Save to localStorage
    // console.log("Selected repairmen:", selectedRepairmen.value);
};

const clearSelected = () => {
    selectedRepairmen.value = []; // Clear the selected repairmen
    updateLocalStorage(); // Clear from localStorage
    console.log("Cleared selected repairmen");
};

const props = defineProps({
    repairmen: {
        type: Array,
        required: true
    },
    repairName: '',
    repairerPic: '',
    revieweeID: String, // Pass the revieweeID as a prop if needed

});
// Router instance
const router = useRouter();

const userType = Cookies.get('userType') || sessionStorage.getItem('userType');


const isQuotesListPopupVisible = ref(false); // State for controlling visibility

const closeModal = () => {
    console.log("Modal closed");
    isQuotesListPopupVisible.value = false; // This should control the visibility of the modal
};

const openQuotesListPopup = () => {
    const uid = Cookies.get('uid') || sessionStorage.getItem('uid')
    if (uid) {
        isQuotesListPopupVisible.value = true; // Set visibility to true when the button is clicked
    }
    else {
        router.push({
            name: 'viewProfile', params: { id: userId }
        });
    }
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

const filteredRepairmen = computed(() => {
    return props.repairmen.filter(repairman => {
        const name = repairman.username || repairman.name;
        const isOthersSelected = selectedExpertise.value.includes("Others");

        const expertiseMatch = isOthersSelected
            ? repairman.expertise.every(skill => !expertiseOptions.value.includes(skill)) // Filter for "Others"
            : selectedExpertise.value.length === 0 || selectedExpertise.value.includes("All") ||
            repairman.expertise.some(skill => selectedExpertise.value.includes(skill));

        const searchMatch = name.toLowerCase().includes(searchQuery.value.toLowerCase()); // Search logic
        return expertiseMatch && searchMatch;
    });
});
// Select and filter Expertise logic
const selectedExpertise = ref([]);

// Available expertise options
const expertiseOptions = ref([
    "Home Appliances",
    "Electrical Fixtures",
    "Plumbing",
    "Air Conditioners",
    "Electronics Repair",
    "Furniture",
    "Windows and Doors",
    "Automotive Repairs",
    "Others"
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

const navigateToProfile = (userId) => {
    console.log('Navigating to profile with ID:', userId); // Debug line
    router.push({
        name: 'viewProfile', // Make sure this matches the name of your route
        params: { id: userId } // Pass the repairman ID as a parameter
    });
};

// Clear all selections
const clearSelections = () => {
    selectedExpertise.value = [];
};


const repairmanRatings = ref({});


async function fetchReviews(revieweeID) {
    try {
        // Query to get reviews for the specified revieweeID
        const reviewsQuery = query(
            collection(db, "reviews"),
            where("revieweeID", "==", revieweeID)
        );

        const querySnapshot = await getDocs(reviewsQuery);
        let totalRating = 0;
        let reviewCount = 0;

        // Map through documents to structure the reviews and calculate total ratings
        const reviews = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            totalRating += data.rating || 0;
            reviewCount += 1;

            return {
                comments: data.comments || "",
                createdAt: data.createdAt || "",
                quoteId: data.quoteId || "",
                rating: data.rating || 0,
                revieweeID: data.revieweeID || "",
                revieweeName: data.revieweeName || "",
                reviewerID: data.reviewerID || "",
                reviewerName: data.reviewerName || "",
            };
        });

        // Calculate the average rating
        const averageRating = reviewCount > 0 ? (totalRating / reviewCount).toFixed(2) : "New Fixer";
        // console.log("avg rating: " + averageRating);
        const totalReviews = reviews.length;

        // Return both the reviews array and the average rating
        return { reviews, averageRating, totalReviews };
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return { reviews: [], averageRating: "Error", totalReviews: "Error" };
    }
};
const fetchRatingsForRepairmen = async () => {
    for (const repairman of filteredRepairmen.value) {
        const rating = await fetchReviews(repairman.id);
        repairmanRatings.value[repairman.id] = rating;
    }

};

watch(filteredRepairmen, async () => {
    await fetchRatingsForRepairmen();
}, { immediate: true });
</script>

<template>
    <!-- New Section for Selected Repairmen -->
    <div v-if="selectedRepairmen.length > 0" class="selected-repairmen-section">
        <div class="container">
            <p class="section-title">Your Selected Repairmen</p>
            <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end;">
                <button @click="openQuotesListPopup" :disabled="selectedRepairmen.length === 0" class="hero-button">Send
                    Quote</button>
                <quoteListPopup v-if="isQuotesListPopupVisible" :selectedRepairmen="selectedRepairmen"
                    @close="closeModal" @quoteSent="clearSelectedRepairmen" />
                <span @click="clearSelected" class="clear-link"
                    style="text-decoration: underline; cursor: pointer; margin-top: 8px; padding-right: 14px;">
                    Clear Selected Repairmen
                </span>
            </div>
        </div>
        <div class="row justify-content-center mt-4">
            <div class="col-lg-3 col-md-4 col-sm-6 custom-col mb-3" v-for="repairman in selectedRepairmenDetails"
                :key="repairman.id" data-aos="fade-up" data-aos-delay="100">
                <div class="card text-center shadow-sm" style="padding: 0; border-radius: 20px;"
                    @click="navigateToProfile(repairman.id)">
                    <div class="card-header d-flex align-items-center"
                        style="background-color: transparent; border: none;">
                        <input type="checkbox" class="custom-checkbox" @click.stop="toggleSelection(repairman.id)"
                            :checked="isSelected(repairman.id)" v-if="userType === 'user'" style="margin-left: auto;" />
                    </div>
                    <img :src="repairman.profilePic || repairman.imageUrl || defaultProfilePic" class="card-img-top"
                        alt="Profile Picture" height="200px" style="object-fit: cover; border-radius: 20px;">
                    <div class="card-body text-start" data-aos="fade-up" data-aos-delay="200">
                        <h5 class="card-title" style="font-weight: bold;">{{ repairman.username || repairman.name }}
                        </h5>
                        <p class="text-muted mb-1">
                            <span class="star-icon">★</span>
                            {{ repairmanRatings[repairman.id]?.averageRating || "0" }}
                            ({{ repairmanRatings[repairman.id]?.totalReviews || "0" }})
                        </p>

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

    <div class="original-repairmen-container">
        <div class="container" id="fixer">
            <p class="section-title" data-aos="fade-up">Browse Our Most Trusted Fixers</p>
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
        <div class="row justify-content-center mt-4">
            <div class="col-lg-3 col-md-4 col-sm-6 custom-col mb-3" v-for="repairman in filteredRepairmen"
                :key="repairman.id" data-aos="fade-up" data-aos-delay="100">

                <div class="card text-center shadow-sm" style="padding: 0; border-radius: 20px;"
                    @click="navigateToProfile(repairman.id)"
                    :class="{ selected: selectedRepairmen.includes(repairman.id) }">
                    <div class="card-header d-flex align-items-center"
                        style="background-color: transparent; border: none;">
                        <input type="checkbox" class="custom-checkbox" @click.stop="toggleSelection(repairman.id)"
                            :checked="isSelected(repairman.id)" v-if="userType === 'user'" style="margin-left: auto;" />
                    </div>
                    <img :src="repairman.profilePic || repairman.imageUrl || defaultProfilePic" class="card-img-top"
                        alt="Profile Picture" height="200px" style="object-fit: cover; border-radius: 20px;">
                    <div class="card-body text-start" data-aos="fade-up" data-aos-delay="200">
                        <h5 class="card-title" style="font-weight: bold;">{{ repairman.username || repairman.name }}
                        </h5>
                        <p class="text-muted mb-1">
                            <span class="star-icon">★</span>
                            {{ repairmanRatings[repairman.id]?.averageRating || "0" }}
                            ({{ repairmanRatings[repairman.id]?.totalReviews || "0" }})
                        </p>

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
    width: 2rem;
    height: 2rem;
    cursor: pointer;
    accent-color: #085C44;
    border: 2px solid #085C44;
    border-radius: 5px;
}

.card {
    background: #ffffff;
    width: 100%;
    height: 500px;
    max-width: 40vw;
    border: 0;
    transition: transform 0.3s, background-color 0.3s ease;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e1e1;
    cursor: pointer;
    width: auto;
    height: 500px;
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

}

.card-body {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 270px;
    overflow: hidden;
    text-align: left;
}

.card-header {
    transition: background-color 0.3s ease;
    background-color: white;
    border: none;
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

/* fill screen width when small screen */
@media (max-width: 575px) {
    .custom-col {
        flex: 1 1 100%;

        display: flex;
        justify-content: center;
    }

    .card {
        width: 90%;
        max-width: 600px;
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


.popup {
    position: fixed;
    z-index: 9999;
}
</style>