const mongoose = require('mongoose');
const Book = require('./server/models/Book');
const User = require('./server/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/bookverse')
  .then(async () => {
    try {
      // Find user by email
      const user = await User.findOne({ email: 'kandelkushal101@gmail.com' });
      
      if (!user) {
        console.log('User not found');
        process.exit(0);
      }
      
      console.log('User found:', user.name, '(ID:', user._id + ')');
      console.log('');
      
      // Find all books owned by this user
      const books = await Book.find({ owner: user._id }).sort({ createdAt: -1 });
      
      console.log('Total books:', books.length);
      console.log('');
      
      if (books.length > 0) {
        books.forEach((book, index) => {
          console.log(`${index + 1}. ${book.title}`);
          console.log(`   Author: ${book.author}`);
          console.log(`   Genre: ${book.genre.join(', ')}`);
          console.log(`   Condition: ${book.condition}`);
          console.log(`   ISBN: ${book.isbn || 'N/A'}`);
          console.log(`   Available: ${book.isAvailable ? 'Yes' : 'No'}`);
          console.log(`   Added: ${book.createdAt.toLocaleDateString()}`);
          console.log('');
        });
      } else {
        console.log('No books found for this user.');
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
    process.exit(1);
  });
