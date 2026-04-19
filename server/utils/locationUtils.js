const axios = require('axios');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get coordinates for a city using OpenStreetMap Nominatim (FREE - No API key needed!)
 * @param {string} cityName - City name (e.g., "New York, NY")
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function geocodeCity(cityName) {
  try {
    // OpenStreetMap Nominatim - Completely FREE, no API key required
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: cityName,
        format: 'json',
        limit: 1,
        addressdetails: 1
      },
      headers: {
        'User-Agent': 'BookVerse/1.0 (Book Trading Platform)' // Required by Nominatim
      },
      timeout: 5000
    });

    if (response.data && response.data.length > 0) {
      const location = response.data[0];
      return {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon)
      };
    }

    throw new Error('City not found');
  } catch (error) {
    console.error('Geocoding error:', error.message);
    throw error;
  }
}

// Meetup location functions removed - not relevant for shipping-based trades

/**
 * Check if two users are in the same city
 * @param {string} city1 - First user's city
 * @param {string} city2 - Second user's city
 * @returns {boolean}
 */
function isSameCity(city1, city2) {
  if (!city1 || !city2) return false;
  
  // Normalize city names for comparison
  const normalize = (city) => city.toLowerCase().trim().replace(/[,\s]+/g, ' ');
  
  return normalize(city1) === normalize(city2);
}

module.exports = {
  calculateDistance,
  geocodeCity,
  isSameCity
};
