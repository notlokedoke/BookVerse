const mongoose = require('mongoose');
const Book = require('./server/models/Book');
const Trade = require('./server/models/Trade');
const User = require('./server/models/User');

mongoose.connect('mongodb://127.0.0.1:27017/bookverse', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const user = await User.findOne({ email: new RegExp('test', 'i') });
    if (!user) {
      console.log('No Test user');
      process.exit(0);
    }
    console.log('User found:', user.email, user._id);
    const books = await Book.find({ owner: user._id });
    console.log('Books length:', books.length);
    console.log('Books isAvailable:', books.map(b => b.isAvailable));
    const trades = await Trade.find({ $or: [{ proposer: user._id }, { receiver: user._id }] });
    console.log('Trades length:', trades.length);
    console.log('Trades status:', trades.map(t => t.status));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
