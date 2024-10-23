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
<script type="module">
    // Import Firebase SDK
    // import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
    // import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js';

    // // Firebase Config
    // const firebaseConfig = {
    //     apiKey: "AIzaSyDiBHdWrHj34O4hn0qP98qgThAAgDuL5JU",
    //     authDomain: "justfix-726f7.firebaseapp.com",
    //     projectId: "justfix-726f7",
    //     storageBucket: "justfix-726f7.appspot.com",
    //     messagingSenderId: "297198741199",
    //     appId: "1:297198741199:web:4a00011fa3067f8014b9ba",
    //     measurementId: "G-YN894CVT62"
    // };

    // // Initialize Firebase
    // const firebaseApp = initializeApp(firebaseConfig);

    // // Initialize Firestore
    // const db = getFirestore(firebaseApp);

    // Function to fetch repairers from Firestore
    async function fetchRepairmen() {
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
    }

    // Google Maps initialization function
    let map;

    async function initMap() {
        const { Map } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        map = new Map(document.getElementById('map'), {
            center: { lat: 1.3521, lng: 103.8198 },
            zoom: 12,
            mapId: 'your-map-id'
        });

        // Fetch repairer locations and add markers
        const repairmen = await fetchRepairmen();
        repairmen.forEach((repairman) => {
            const customContent = document.createElement('div');
            const img = document.createElement('img');
            img.src = './images/newpin.png';
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

    window.initMap = initMap;
    </script>