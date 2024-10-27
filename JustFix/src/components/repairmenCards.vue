<script setup>
import defaultProfilePic from '../assets/profile.jpg';
</script>

<template>
    <div class="container repairmen-container mt-4">
        <p href="#repairers" style="font-weight:bold; font-size:larger; padding-top:35px; padding-bottom:10px;">
            Browse Our Most Trusted Repairers
        </p>
        <div class="row justify-content-center gx-4">
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4 custom-col" v-for="repairman in repairmen" :key="repairman.id">
                <a href="#" class="card-link" style="text-decoration: none;">
                    <div class="card text-center shadow-sm clickable-card" style="padding:0; border-radius: 20px;">
                        <img :src="repairman.profilePic || defaultProfilePic" class="card-img-top" alt="Profile Picture"
                            height="200px" style="object-fit: cover; border-radius: 20px;">
                        <div class="card-body text-start">
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
                                <li v-for="(skill, index) in topSkills(repairman.expertise)" :key="index">
                                    {{ skill }}
                                </li>
                            </ul>
                            <p class="price" style="font-weight: bold;">From SGD 111</p>
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
</style>