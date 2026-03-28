#!/usr/bin/env node

/**
 * Test Environment Diagnostic Tool
 * 
 * Run this to diagnose why tests are failing
 * Usage: node __tests__/diagnose.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         BookVerse Test Environment Diagnostic              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function diagnose() {
  const issues = [];
  const warnings = [];
  
  // Check 1: Environment variables
  console.log('1. Checking environment variables...');
  const envTestPath = path.join(__dirname, '..', '.env.test');
  
  if (fs.existsSync(envTestPath)) {
    console.log('   ✓ .env.test file exists');
    require('dotenv').config({ path: envTestPath });
    
    if (process.env.MONGODB_URI) {
      console.log(`   ✓ MONGODB_URI is set: ${process.env.MONGODB_URI}`);
    } else {
      issues.push('.env.test exists but MONGODB_URI is not set');
      console.log('   ✗ MONGODB_URI is not set in .env.test');
    }
    
    if (process.env.JWT_SECRET) {
      console.log('   ✓ JWT_SECRET is set');
    } else {
      warnings.push('JWT_SECRET is not set (will use default)');
      console.log('   ⚠ JWT_SECRET is not set');
    }
  } else {
    issues.push('.env.test file does not exist');
    console.log('   ✗ .env.test file not found');
    console.log('   → Create it with: echo "MONGODB_URI=mongodb://127.0.0.1:27017/bookverse-test" > .env.test');
  }
  
  // Check 2: MongoDB connection
  console.log('\n2. Testing MongoDB connection...');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookverse-test';
  
  try {
    console.log(`   Attempting to connect to: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('   ✓ Successfully connected to MongoDB');
    console.log(`   ✓ Database: ${mongoose.connection.name}`);
    console.log(`   ✓ Host: ${mongoose.connection.host}`);
    
    // Try a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   ✓ Found ${collections.length} collections`);
    
    await mongoose.connection.close();
    console.log('   ✓ Connection closed successfully');
    
  } catch (error) {
    issues.push(`MongoDB connection failed: ${error.message}`);
    console.log('   ✗ Failed to connect to MongoDB');
    console.log(`   Error: ${error.message}`);
    console.log('\n   Possible solutions:');
    console.log('   1. Start MongoDB: mongod --dbpath /usr/local/var/mongodb');
    console.log('   2. Or with Homebrew: brew services start mongodb-community');
    console.log('   3. Check if port 27017 is available: lsof -i :27017');
  }
  
  // Check 3: Node modules
  console.log('\n3. Checking dependencies...');
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  
  if (fs.existsSync(nodeModulesPath)) {
    console.log('   ✓ node_modules directory exists');
    
    // Check for key dependencies
    const deps = ['jest', 'supertest', 'mongoose'];
    for (const dep of deps) {
      const depPath = path.join(nodeModulesPath, dep);
      if (fs.existsSync(depPath)) {
        console.log(`   ✓ ${dep} is installed`);
      } else {
        issues.push(`${dep} is not installed`);
        console.log(`   ✗ ${dep} is not installed`);
      }
    }
  } else {
    issues.push('node_modules directory does not exist');
    console.log('   ✗ node_modules not found');
    console.log('   → Run: npm install');
  }
  
  // Check 4: Jest configuration
  console.log('\n4. Checking Jest configuration...');
  const jestConfigPath = path.join(__dirname, '..', 'jest.config.js');
  
  if (fs.existsSync(jestConfigPath)) {
    console.log('   ✓ jest.config.js exists');
    const config = require(jestConfigPath);
    console.log(`   ✓ Test timeout: ${config.testTimeout}ms`);
    console.log(`   ✓ Max workers: ${config.maxWorkers || 'default'}`);
  } else {
    warnings.push('jest.config.js not found');
    console.log('   ⚠ jest.config.js not found');
  }
  
  // Check 5: Test files
  console.log('\n5. Checking test files...');
  const testDir = __dirname;
  const testFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.test.js'));
  
  console.log(`   ✓ Found ${testFiles.length} test files`);
  if (testFiles.length > 0) {
    console.log(`   Examples: ${testFiles.slice(0, 3).join(', ')}`);
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      DIAGNOSTIC SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✓ All checks passed! Your test environment is ready.');
    console.log('\nYou can now run tests:');
    console.log('  npm test');
  } else {
    if (issues.length > 0) {
      console.log('✗ ISSUES FOUND:\n');
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠ WARNINGS:\n');
      warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('RECOMMENDED ACTIONS:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    if (issues.some(i => i.includes('MongoDB'))) {
      console.log('1. Start MongoDB:');
      console.log('   mongod --dbpath /usr/local/var/mongodb');
      console.log('   OR');
      console.log('   brew services start mongodb-community\n');
    }
    
    if (issues.some(i => i.includes('.env.test'))) {
      console.log('2. Create .env.test file:');
      console.log('   echo "MONGODB_URI=mongodb://127.0.0.1:27017/bookverse-test" > .env.test');
      console.log('   echo "JWT_SECRET=test_jwt_secret_key_for_testing_only" >> .env.test\n');
    }
    
    if (issues.some(i => i.includes('node_modules'))) {
      console.log('3. Install dependencies:');
      console.log('   npm install\n');
    }
    
    console.log('4. Run this diagnostic again:');
    console.log('   node __tests__/diagnose.js\n');
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run diagnostic
diagnose().catch(error => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});
