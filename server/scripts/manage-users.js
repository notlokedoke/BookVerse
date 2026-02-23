/**
 * User Management Script
 * 
 * Usage:
 *   node scripts/manage-users.js list              # List all users
 *   node scripts/manage-users.js count             # Count users
 *   node scripts/manage-users.js delete <email>    # Delete user by email
 *   node scripts/manage-users.js delete-id <id>    # Delete user by ID
 *   node scripts/manage-users.js clear             # Delete ALL users (careful!)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Book = require('../models/Book');
const Trade = require('../models/Trade');
const Rating = require('../models/Rating');
const Wishlist = require('../models/Wishlist');
const Message = require('../models/Message');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookverse');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const listUsers = async () => {
  try {
    const users = await User.find({}, 'name email city averageRating ratingCount createdAt')
      .sort({ createdAt: -1 });
    
    console.log('\n📋 Users in database:\n');
    console.log('─'.repeat(100));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   City: ${user.city || 'Not set'}`);
      console.log(`   Rating: ${user.averageRating.toFixed(1)} (${user.ratingCount} ratings)`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   ID: ${user._id}`);
      console.log('─'.repeat(100));
    });
    
    console.log(`\nTotal: ${users.length} users\n`);
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
};

const countUsers = async () => {
  try {
    const count = await User.countDocuments();
    console.log(`\n📊 Total users: ${count}\n`);
  } catch (error) {
    console.error('❌ Error counting users:', error);
  }
};

const deleteUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`\n❌ User with email "${email}" not found\n`);
      return;
    }
    
    console.log(`\n🗑️  Deleting user: ${user.name} (${user.email})`);
    
    // Delete related data
    const booksDeleted = await Book.deleteMany({ owner: user._id });
    const tradesDeleted = await Trade.deleteMany({
      $or: [{ proposer: user._id }, { receiver: user._id }]
    });
    const ratingsDeleted = await Rating.deleteMany({
      $or: [{ rater: user._id }, { ratedUser: user._id }]
    });
    const wishlistDeleted = await Wishlist.deleteMany({ user: user._id });
    const messagesDeleted = await Message.deleteMany({ sender: user._id });
    
    // Delete user
    await User.deleteOne({ _id: user._id });
    
    console.log('✅ User deleted successfully');
    console.log(`   - Books deleted: ${booksDeleted.deletedCount}`);
    console.log(`   - Trades deleted: ${tradesDeleted.deletedCount}`);
    console.log(`   - Ratings deleted: ${ratingsDeleted.deletedCount}`);
    console.log(`   - Wishlist items deleted: ${wishlistDeleted.deletedCount}`);
    console.log(`   - Messages deleted: ${messagesDeleted.deletedCount}\n`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  }
};

const deleteUserById = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('\n❌ Invalid user ID format\n');
      return;
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      console.log(`\n❌ User with ID "${id}" not found\n`);
      return;
    }
    
    console.log(`\n🗑️  Deleting user: ${user.name} (${user.email})`);
    
    // Delete related data
    const booksDeleted = await Book.deleteMany({ owner: user._id });
    const tradesDeleted = await Trade.deleteMany({
      $or: [{ proposer: user._id }, { receiver: user._id }]
    });
    const ratingsDeleted = await Rating.deleteMany({
      $or: [{ rater: user._id }, { ratedUser: user._id }]
    });
    const wishlistDeleted = await Wishlist.deleteMany({ user: user._id });
    const messagesDeleted = await Message.deleteMany({ sender: user._id });
    
    // Delete user
    await User.deleteOne({ _id: user._id });
    
    console.log('✅ User deleted successfully');
    console.log(`   - Books deleted: ${booksDeleted.deletedCount}`);
    console.log(`   - Trades deleted: ${tradesDeleted.deletedCount}`);
    console.log(`   - Ratings deleted: ${ratingsDeleted.deletedCount}`);
    console.log(`   - Wishlist items deleted: ${wishlistDeleted.deletedCount}`);
    console.log(`   - Messages deleted: ${messagesDeleted.deletedCount}\n`);
  } catch (error) {
    console.error('❌ Error deleting user:', error);
  }
};

const clearAllUsers = async () => {
  try {
    console.log('\n⚠️  WARNING: This will delete ALL users and related data!');
    console.log('Press Ctrl+C to cancel...\n');
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const userCount = await User.countDocuments();
    
    if (userCount === 0) {
      console.log('ℹ️  No users to delete\n');
      return;
    }
    
    console.log(`🗑️  Deleting ${userCount} users and all related data...`);
    
    // Delete all related data
    const booksDeleted = await Book.deleteMany({});
    const tradesDeleted = await Trade.deleteMany({});
    const ratingsDeleted = await Rating.deleteMany({});
    const wishlistDeleted = await Wishlist.deleteMany({});
    const messagesDeleted = await Message.deleteMany({});
    
    // Delete all users
    await User.deleteMany({});
    
    console.log('✅ All users deleted successfully');
    console.log(`   - Users deleted: ${userCount}`);
    console.log(`   - Books deleted: ${booksDeleted.deletedCount}`);
    console.log(`   - Trades deleted: ${tradesDeleted.deletedCount}`);
    console.log(`   - Ratings deleted: ${ratingsDeleted.deletedCount}`);
    console.log(`   - Wishlist items deleted: ${wishlistDeleted.deletedCount}`);
    console.log(`   - Messages deleted: ${messagesDeleted.deletedCount}\n`);
  } catch (error) {
    console.error('❌ Error clearing users:', error);
  }
};

const main = async () => {
  await connectDB();
  
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'list':
      await listUsers();
      break;
    case 'count':
      await countUsers();
      break;
    case 'delete':
      if (!arg) {
        console.log('\n❌ Please provide an email address\n');
        console.log('Usage: node scripts/manage-users.js delete <email>\n');
      } else {
        await deleteUserByEmail(arg);
      }
      break;
    case 'delete-id':
      if (!arg) {
        console.log('\n❌ Please provide a user ID\n');
        console.log('Usage: node scripts/manage-users.js delete-id <id>\n');
      } else {
        await deleteUserById(arg);
      }
      break;
    case 'clear':
      await clearAllUsers();
      break;
    default:
      console.log('\n📖 User Management Script\n');
      console.log('Usage:');
      console.log('  node scripts/manage-users.js list              # List all users');
      console.log('  node scripts/manage-users.js count             # Count users');
      console.log('  node scripts/manage-users.js delete <email>    # Delete user by email');
      console.log('  node scripts/manage-users.js delete-id <id>    # Delete user by ID');
      console.log('  node scripts/manage-users.js clear             # Delete ALL users (careful!)\n');
  }
  
  await mongoose.connection.close();
  console.log('👋 Disconnected from MongoDB');
  process.exit(0);
};

main();
