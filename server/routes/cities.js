const express = require('express');
const router = express.Router();
const { trackAPIUsage, getUsageStats, checkUsageLimits } = require('../middleware/api-usage-tracker');

// Apply usage tracking middleware to all routes
router.use(checkUsageLimits);

// Phase 2: Google Places API integration for unlimited global city coverage
// Note: You'll need to set up Google Places API key in your environment variables

/**
 * Search cities globally using Google Places API
 * GET /api/cities/search?q=searchTerm
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ cities: [] });
    }

    // Check if Google Places API key is configured
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.log('Google Places API key not configured, returning empty results');
      return res.json({ 
        cities: [],
        message: 'External city search not configured'
      });
    }

    // Make request to Google Places API
    const fetch = (await import('node-fetch')).default;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(q)}&` +
      `types=(cities)&` +
      `key=${apiKey}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API status: ${data.status}`);
    }

    // Extract city names from Google Places response
    const cities = data.predictions ? data.predictions.map(prediction => {
      // Clean up the description to remove unnecessary details
      let cityName = prediction.description;
      
      // Remove country if it's at the end and separated by comma
      const parts = cityName.split(', ');
      if (parts.length > 2) {
        // Keep city and state/region, remove country
        cityName = parts.slice(0, -1).join(', ');
      }
      
      return cityName;
    }) : [];

    // Track successful API usage
    trackAPIUsage(true);

    res.json({ 
      cities: cities.slice(0, 8), // Limit to 8 results
      source: 'google_places'
    });

  } catch (error) {
    console.error('Error searching cities:', error);
    
    // Track failed API usage
    trackAPIUsage(false);
    
    res.status(500).json({ 
      error: 'Failed to search cities',
      cities: []
    });
  }
});

/**
 * Alternative: Search cities using a free service (OpenStreetMap Nominatim)
 * This is a backup option if Google Places API is not available
 */
router.get('/search-free', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ cities: [] });
    }

    const fetch = (await import('node-fetch')).default;
    
    // Use OpenStreetMap Nominatim (free but rate-limited)
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(q)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=8&` +
      `featuretype=city`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BookVerse-App/1.0 (contact@bookverse.com)' // Required by Nominatim
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract city names from Nominatim response
    const cities = data.map(item => {
      const address = item.address || {};
      const city = address.city || address.town || address.village || item.display_name.split(',')[0];
      const state = address.state || address.region;
      const country = address.country;
      
      // Format: "City, State, Country" or "City, Country"
      let formattedName = city;
      if (state && state !== city) {
        formattedName += `, ${state}`;
      }
      if (country && country !== state) {
        formattedName += `, ${country}`;
      }
      
      return formattedName;
    }).filter(city => city && city.length > 0);

    res.json({ 
      cities: [...new Set(cities)], // Remove duplicates
      source: 'nominatim'
    });

  } catch (error) {
    console.error('Error searching cities with Nominatim:', error);
    res.status(500).json({ 
      error: 'Failed to search cities',
      cities: []
    });
  }
});

/**
 * Get popular cities by region
 * GET /api/cities/popular?region=europe
 */
router.get('/popular', (req, res) => {
  const { region } = req.query;
  
  const popularCitiesByRegion = {
    'north-america': [
      'New York, NY', 'Los Angeles, CA', 'Toronto, ON', 'Mexico City, Mexico',
      'Chicago, IL', 'Vancouver, BC', 'San Francisco, CA', 'Montreal, QC'
    ],
    'europe': [
      'London, United Kingdom', 'Paris, France', 'Berlin, Germany', 'Madrid, Spain',
      'Rome, Italy', 'Amsterdam, Netherlands', 'Vienna, Austria', 'Stockholm, Sweden'
    ],
    'asia': [
      'Tokyo, Japan', 'Seoul, South Korea', 'Singapore', 'Bangkok, Thailand',
      'Mumbai, India', 'Beijing, China', 'Dubai, UAE', 'Jakarta, Indonesia'
    ],
    'oceania': [
      'Sydney, Australia', 'Melbourne, Australia', 'Auckland, New Zealand',
      'Brisbane, Australia', 'Perth, Australia', 'Wellington, New Zealand'
    ],
    'south-america': [
      'São Paulo, Brazil', 'Buenos Aires, Argentina', 'Rio de Janeiro, Brazil',
      'Santiago, Chile', 'Lima, Peru', 'Bogotá, Colombia'
    ],
    'africa': [
      'Cairo, Egypt', 'Lagos, Nigeria', 'Cape Town, South Africa',
      'Casablanca, Morocco', 'Nairobi, Kenya', 'Johannesburg, South Africa'
    ]
  };
  
  const cities = popularCitiesByRegion[region] || [];
  res.json({ cities, region });
});

/**
 * Get API usage statistics
 * GET /api/cities/usage-stats
 */
router.get('/usage-stats', (req, res) => {
  const stats = getUsageStats();
  res.json(stats);
});

module.exports = router;