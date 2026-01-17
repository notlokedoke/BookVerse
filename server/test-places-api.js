#!/usr/bin/env node

/**
 * Test script for Google Places API integration
 * Run with: node test-places-api.js
 */

require('dotenv').config();

async function testPlacesAPI() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  console.log('🔍 Testing Google Places API Integration...\n');
  
  if (!apiKey) {
    console.log('❌ GOOGLE_PLACES_API_KEY not found in environment variables');
    console.log('💡 Add your API key to server/.env file:');
    console.log('   GOOGLE_PLACES_API_KEY=your_api_key_here\n');
    return;
  }
  
  console.log('✅ API Key found in environment');
  console.log(`🔑 Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);
  
  try {
    // Test the API with a simple query
    const fetch = (await import('node-fetch')).default;
    const testQuery = 'London';
    
    console.log(`🌍 Testing search for: "${testQuery}"`);
    
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?` +
      `input=${encodeURIComponent(testQuery)}&` +
      `types=(cities)&` +
      `key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log('✅ API Test Successful!\n');
      console.log('📍 Found cities:');
      data.predictions.slice(0, 5).forEach((prediction, index) => {
        console.log(`   ${index + 1}. ${prediction.description}`);
      });
      console.log('\n🎉 Your Google Places API is working correctly!');
      console.log('💡 You can now use unlimited global city search in BookVerse.\n');
      
    } else if (data.status === 'REQUEST_DENIED') {
      console.log('❌ API Request Denied');
      console.log('🔧 Possible issues:');
      console.log('   • API key is invalid');
      console.log('   • Places API is not enabled');
      console.log('   • API key restrictions are too strict');
      console.log('   • Billing is not set up (required for Places API)\n');
      
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.log('⚠️  Query Limit Exceeded');
      console.log('💰 You have exceeded your API quota');
      console.log('💡 Check your Google Cloud Console billing and quotas\n');
      
    } else {
      console.log(`❌ API Error: ${data.status}`);
      console.log('📄 Response:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    console.log('🔧 Check your internet connection and API key\n');
  }
}

// Test the local endpoint as well
async function testLocalEndpoint() {
  try {
    console.log('🔍 Testing local API endpoint...');
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:5000/api/cities/search?q=Tokyo');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Local endpoint working!');
      console.log('📍 Cities found:', data.cities.length);
      if (data.cities.length > 0) {
        console.log('   Example:', data.cities[0]);
      }
    } else {
      console.log('❌ Local endpoint error:', response.status);
    }
  } catch (error) {
    console.log('⚠️  Local server not running or endpoint not available');
    console.log('💡 Start your server with: npm run dev');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the tests
async function runTests() {
  await testPlacesAPI();
  await testLocalEndpoint();
}

runTests().catch(console.error);