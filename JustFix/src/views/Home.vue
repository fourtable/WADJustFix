<template>
    <section class="hero">
            <div class="container">
              <div class="row">
                <!-- First Hero Box -->
                <div class="col-lg-6 col-md-6 col-sm-12 my-3">
                  <div class="hero-box light-blue">
                    <h1>Need Something Fixed?</h1>
                    <p>Chat with a repairer and get a quick quote for your repair!</p>
                    <a :href="repairLink" class="button">Browse Trusted Repairers &rarr;</a>
                  </div>
                </div>
                <!-- Second and Third Hero Boxes -->
                <div class="col-lg-6 col-md-6 col-sm-12 my-3">
                  <div class="hero-box light-green">
                    <h2>Join Us As a Repairer!</h2>
                    <p>Whether you're a repair hobbyist or a professional repairer, we welcome you!</p>
                    <a :href="registerLink" class="button">Register Now &rarr;</a>
                  </div>
                  <div class="col-12 hero-box dark-green mt-4">
                    <h2>Discover Our Repair Events</h2>
                    <p>Attend our events to learn DIY repair techniques or upskill as a repairer.</p>
                    <a :href="eventLink" class="button">Learn More &rarr;</a>
                  </div>
                </div>
              </div>
            </div>
          </section>

        <!-- Map Section -->
        <div class="container mt-4">
            <div class="row">
                <div class="col-12">
                    <input type="text" class="form-control" v-model="searchQuery" placeholder="Search repairers by name, expertise, or location..." @input="filterRepairers" />
                </div>
            </div>
        </div>
        <section class="container mt-4 ">
            <div class="row">
              <div class="col-12">
                <div id="map" class="map-container"></div>
              </div>
            </div>
        </section>
</template>
<script>
import { db } from "../main";
import { query, collection, where, getDocs } from "firebase/firestore"; // Import Firestore methods
import newpin from '../assets/newpin.png';

export default {
    data() {
        return {
            searchQuery: '',
            repairLink: '#', // Define your links
            registerLink: '#',
            eventLink: '#'
        };
    },
    mounted() {
        this.initMap();
    },
    methods: {
        async fetchRepairers() {
            const q = query(collection(db, 'users'), where('userType', '==', 'repairer'));
            const querySnapshot = await getDocs(q);
            const repairmen = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.businessLocation && data.businessLocation.lat && data.businessLocation.lng) {
                    repairmen.push({
                        name: data.name,
                        lat: data.businessLocation.lat,
                        lng: data.businessLocation.lng
                    });
                }
            });
            return repairmen;
        },
        async initMap() {
            const { Map } = await google.maps.importLibrary("maps");
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

            const map = new Map(document.getElementById('map'), {
                center: { lat: 1.3521, lng: 103.8198 },
                zoom: 12,
                mapId: 'your-map-id' // Replace with your map ID if you have one
            });

            const repairmen = await this.fetchRepairers();
            repairmen.forEach((repairman) => {
                const customContent = document.createElement('div');
                const img = document.createElement('img');
                img.src = newpin; // Ensure this path is correct
                img.style.width = '100px';
                img.style.height = '100px';
                customContent.appendChild(img);

                new AdvancedMarkerElement({
                    position: { lat: repairman.lat, lng: repairman.lng },
                    map: map,
                    title: repairman.name,
                    content: customContent
                });
            });
        }
    }
}
</script>
<style>
.map-container {
    width: 100%;
    height: 500px; /* Set a default height */
}
</style>