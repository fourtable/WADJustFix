<script setup>
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

// Define your methods here
const topSkills = (expertise) => {
    return expertise.slice(0, 3); // Return top 3 skills or adjust logic as needed
};

const truncateDescription = (description, maxLength = 100) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + '...'; // Append ellipsis
};

const startChat = (repairman) => {
    router.push({
        path: '/chat', query: {
            repairerId: repairman.id,
            repairName: repairman.username || repairman.name,
            repairerPic: repairman.imageUrl || defaultProfilePic
        }
    });
};

</script>

<template>
    <div class="container repairmen-container mt-4">
        <p style="font-weight:bolder; font-size:x-large; padding-top:35px; padding-bottom:10px;">
            Browse Our Most Trusted Repairers
        </p>
        <div class="row justify-content-center gx-4">
            <div class="col-lg-3 col-md-4 col-sm-6 mb-4 custom-col" v-for="repairman in repairmen" :key="repairman.id">
                <div class="card text-center shadow-sm clickable-card" style="padding:0; border-radius: 20px;">
                    <img :src="repairman.imageUrl || defaultProfilePic" class="card-img-top" alt="Profile Picture"
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

                        <p class="card-description text-muted" style="font-size: 0.9rem;">
                            {{ truncateDescription(repairman.description) }}
                        </p>

                        <ul class="list-unstyled">
                            <li v-for="(skill, index) in topSkills(repairman.expertise)" :key="index"
                                class="skill-pill">
                                {{ skill }}
                            </li>
                        </ul>
                        <button class="button mt-3">Request a Quote</button>
                        <button class="button mt-3" @click="startChat(repairman)">Chat</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add any styles specific to this component here */
.card:hover {
    transform: translateY(-5px);
    background-color: #f7f7f7;
}

.card {
    background: transparent;
    padding: 20px;
    width: 100%;
    max-width: 40vw;
    border: 0;
    transition: transform 0.3s;
    border-radius: 10px;
    background-color: #ffffff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border: 1px solid #e1e1e1;
}

.card-body {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 270px;
    overflow: hidden;
}

ul.list-unstyled {
    padding-left: 0;
    margin-bottom: auto;
}

.skill-pill {
    display: inline-block;
    padding: 4px 8px;
    font-size: 0.8rem;
    border: 1px solid #085C44;
    color: #085C44;
    border-radius: 15px;
    margin-right: 5px;
    margin-bottom: 5px;
    background-color: #ffffff;
    white-space: nowrap;
}

.star-icon {
    color: #085C44;
}
</style>
