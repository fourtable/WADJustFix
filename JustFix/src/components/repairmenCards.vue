<script setup>
import defaultProfilePic from '../assets/profile.jpg';
</script>

<template>
    <div class="container repairmen-container mt-4">
        <p href="#repairers" style="font-weight:bolder; font-size:x-large; padding-top:35px; padding-bottom:10px;">
            Browse Our Most Trusted Repairers
        </p>
        <div class="row justify-content-center gx-4">
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4 custom-col" v-for="repairman in repairmen" :key="repairman.id">
                <a href="" class="card-link" style="text-decoration: none;">
                    <div class="card text-center shadow-sm clickable-card" style="padding:0; border-radius: 20px;">
                        <img :src="repairman.profilePic || defaultProfilePic" class="card-img-top" alt="Profile Picture"
                            height="200px" style="object-fit: cover; border-radius: 20px;">
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
                            <ul class="list-unstyled">
                                <li v-for="(skill, index) in topSkills(repairman.expertise)" :key="index"
                                    class="skill-pill">
                                    {{ skill }}
                                </li>
                            </ul>
                            <button class="button mt-3">Request a Quote</button>

                        </div>
                    </div>
                </a>
            </div>
        </div>
    </div>
</template>


<script>
export default {
    props: {
        repairmen: {
            type: Array,
            required: true
        }
    },
    methods: {
        topSkills(expertise) {
            // Assuming expertise is an array; modify as needed
            return expertise.slice(0, 3); // Return top 3 skills or adjust logic as needed
        }
    }
}
</script>

<style scoped>
/* Add any styles specific to this component here */
.card:hover {
    transform: translateY(-5px);
    background-color: #f7f7f7;
    /* Light gray on hover */
}

.card {
    background: transparent;
    padding: 20px;
    width: 100%;
    max-width: 40vw;
    /* Increase this value to make the card wider */
    border: 0;
    transition: transform 0.3s;
    border-radius: 10px;
    background-color: #ffffff;
    /* White background */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    /* Subtle shadow */
    border: 1px solid #e1e1e1;
    /* Light border */
}

.skill-pill {
    display: inline-block;
    padding: 4px 8px;
    font-size: 0.8rem;
    border: 1px solid #085C44;
    /* Change color as needed */
    color: #085C44;
    border-radius: 15px;
    margin-right: 5px;
    margin-bottom: 5px;
    background-color: #ffffff;
    /* Light blue background, adjust as needed */
    white-space: nowrap;
}

.star-icon {
    color: #085C44;
}
</style>