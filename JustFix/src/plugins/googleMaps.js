import { db } from "../main";
import { query, collection, where, getDocs } from "firebase/firestore"; // Import Firestore methods

let map;
let repairmenMarkers = [];
let searchCircle;

export const initializeMap = async (mapElementId, userLocation) => {
  const { Map } = await google.maps.importLibrary("maps");

  // Define bounds for Singapore
  const singaporeBounds = {
    north: 1.477,
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
};

export const fetchRepairers = async () => {
  const q = query(collection(db, 'users'), where('userType', '==', 'repairer'));
  const querySnapshot = await getDocs(q);
  const repairmen = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.businessLocation && data.businessLocation.lat && data.businessLocation.lng) {
      repairmen.push({
        name: data.name,
        lat: data.businessLocation.lat,
        lng: data.businessLocation.lng,
      });
    }
  });
  return repairmen; // Return the fetched repairers
};

export const placeRepairmenOnMap = (repairmen) => {
  clearMarkers();
  repairmen.forEach((repairman) => {
    const marker = new google.maps.Marker({
      position: { lat: repairman.lat, lng: repairman.lng },
      map: map,
      title: repairman.name,
    });
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
};
