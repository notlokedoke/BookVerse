#!/usr/bin/env node

/**
 * Script to count users from Kathmandu
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function countKathmanduUsers() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB\n');

    // Count users from Kathmandu (case-insensitive search)
    const kathmanduCount = await User.countDocuments({
      city: { $regex: /kathmandu/i }
    });

    // Get all unique cities to see variations
    const allCities = await User.distinct('city');
    const kathmanduVariations = allCities.filter(city => 
      city && city.toLowerCase().includes('kathmandu')
    );

    // Get detailed user info from Kathmandu
    const kathmanduUsers = await User.find(
      { city: { $regex: /kathmandu/i } },
      { name: 1, email: 1, city: 1, createdAt: 1, _id: 0 }
    ).sort({ createdAt: -1 });

    // Display results
    console.log('='.repeat(60));
    console.log('KATHMANDU USERS REPORT');
    console.log('='.repeat(60));
    console.log(`\nTotal users from Kathmandu: ${kathmanduCount}`);
    
    if (kathmanduVariations.length > 0) {
      console.log(`\nCity name variations found:`);
      kathmanduVariations.forEach(city => {
        console.log(`  - ${city}`);
      });
    }

    if (kathmanduUsers.length > 0) {
      console.log(`\nUser Details:`);
      console.log('-'.repeat(60));
      kathmanduUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   City: ${user.city}`);
        console.log(`   Joined: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    } else {
      console.log('\nNo users found from Kathmandu.');
    }

    // Additional statistics
    const totalUsers = await User.countDocuments();
    const percentage = totalUsers > 0 ? ((kathmanduCount / totalUsers) * 100).toFixed(2) : 0;
    
    console.log('='.repeat(60));
    console.log('STATISTICS');
    console.log('='.repeat(60));
    console.log(`Total users in database: ${totalUsers}`);
    console.log(`Users from Kathmandu: ${kathmanduCount}`);
    console.log(`Percentage: ${percentage}%`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

// Run the script
countKathmanduUsers();
