import { db } from "../main";
import { query, collection, where, getDocs } from "firebase/firestore"; // Import Firestore methods
import router from '../router'; // Ensure router is imported for navigation

let map;
let repairmenMarkers = [];
let searchCircle;

export const initializeMap = async (mapElementId, userLocation) => {
  const { Map } = await google.maps.importLibrary("maps");

  // Define bounds for Singapore
  const singaporeBounds = {
    north: 1.617,
    south: 1.130,
    west: 103.609,
    east: 104.028,
  };

  map = new Map(document.getElementById(mapElementId), {
    center: { lat: 1.3521, lng: 103.8198 }, // Singapore center
    zoom: 12,
    restriction: {
      latLngBounds: singaporeBounds,
      strictBounds: false,
    },
  });

  google.maps.event.trigger(map, "resize");

  // Get user's current location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude   

      };

      // Update search circle and marker visibility
      updateSearchCircle(userLocation, 10); // Adjust radius as needed
    }, function(error) {
      console.error("Error getting user location:", error);
      // Handle error, e.g., show a message to the user
    });
  }
};

export const fetchRepairers = async () => {
  const q = query(collection(db, 'users'), where('userType', '==', 'repairer'));
  const querySnapshot = await getDocs(q);
  const repairmen = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.businessLocation && data.businessLocation.lat && data.businessLocation.lng) {
      repairmen.push({
        id: doc.id, // Use document ID for navigation
        name: data.name,
        lat: data.businessLocation.lat,
        lng: data.businessLocation.lng,
        rating: data.rating || 'N/A', // Optional, in case you want to display rating
        expertise: data.expertise || [], // Optional, for displaying expertise
        description: data.description || 'No description available', // Retrieve description field
      });
    }
  });
  return repairmen; // Return the fetched repairers
};

let currentInfoWindow = null; // Variable to track the currently open info window

export const placeRepairmenOnMap = (repairmen) => {
  clearMarkers(); // Clear previous markers before placing new ones

  repairmen.forEach((repairman) => {
    const marker = new google.maps.Marker({
      position: { lat: repairman.lat, lng: repairman.lng },
      map: null, // Initially set map to null
      title: repairman.name,
    });

    // Create an info window with max-width style for better usability
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="max-width: 200px; font-size: 14px;">
          <h4>${repairman.name}</h4>
          <p>Rating: ${repairman.rating}</p>
          <p>Expertise: ${repairman.expertise.length > 0 ? repairman.expertise.join(', ') : 'N/A'}</p>
          <p>Description: ${repairman.description}</p>
          <button id="viewProfileBtn-${repairman.id}" style="cursor:pointer; background-color:#007BFF; color:white; border:none; padding:5px 10px; border-radius:4px;">View Profile</button>
        </div>
      `,
    });

    // Add a click event listener to the marker to open the info window
    marker.addListener('click', () => {
      // Close the currently open info window, if any
      if (currentInfoWindow) {
        currentInfoWindow.close();
      }

      // Open the new info window
      infoWindow.open(map, marker);
      currentInfoWindow = infoWindow;

      // Pan the map if the marker is near the boundary
      const mapBounds = map.getBounds();
      if (mapBounds && !mapBounds.contains(marker.getPosition())) {
        map.panTo(marker.getPosition());
      } else {
        // Adjust the map slightly to the left or right to make room for the info window
        const panOffset = 0.005; // Adjust this value as needed
        map.panTo({
          lat: marker.getPosition().lat(),
          lng: marker.getPosition().lng() - panOffset,
        });
      }
    });

    // Add an event listener for the button in the info window to navigate to the profile
    google.maps.event.addListener(infoWindow, 'domready', () => {
      const button = document.getElementById(`viewProfileBtn-${repairman.id}`);
      if (button) {
        button.addEventListener('click', () => {
          console.log('Navigating to profile:', repairman.id); // Debug log
          // Navigate to the repairer's profile by passing the repairman's ID
          router.push({ name: 'viewProfile', params: { id: repairman.id } });
        });
      } else {
        console.error(`Button for View Profile not found for repairman ID ${repairman.id}`);
      }
    });

    // Check if the marker is within the search circle and set its map accordingly
    if (searchCircle && google.maps.geometry.spherical.computeDistanceBetween(searchCircle.getCenter(), marker.getPosition()) <= searchCircle.getRadius()) {
      marker.setMap(map);
    } else {
      marker.setMap(null); // Hide markers outside the circle
    }

    // Push each marker to the repairmenMarkers array for future reference
    repairmenMarkers.push(marker);
  });
};

// Clears existing markers
export const clearMarkers = () => {
  repairmenMarkers.forEach((marker) => marker.setMap(null));
  repairmenMarkers = [];
};

// Update the search circle based on the selected location and radius
export const updateSearchCircle = (location, radius) => {
  if (searchCircle) {
    searchCircle.setMap(null); // Remove the previous circle
  }

  searchCircle = new google.maps.Circle({
    center: location,
    radius: radius * 1000, // Radius in meters
    map: map,
    fillColor: "#ADD8E6",
    fillOpacity: 0.10,
    strokeColor: "#FF0000",
    strokeOpacity: 0.5,
    strokeWeight: 2,
  });

  map.fitBounds(searchCircle.getBounds()); // Adjust map bounds to fit the circle

  // Update marker visibility based on the new search circle
  repairmenMarkers.forEach((marker) => {
    if (searchCircle && google.maps.geometry.spherical.computeDistanceBetween(searchCircle.getCenter(), marker.getPosition()) <= searchCircle.getRadius()) {
      marker.setMap(map);
    } else {
      marker.setMap(null); // Hide markers outside the circle
    }
  });
};