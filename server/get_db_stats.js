const mongoose = require('mongoose');
const Book = require('./models/Book');
const Trade = require('./models/Trade');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/bookverse', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const users = await User.find({ name: 'Test User' });
    for (const u of users) {
      console.log('User:', u._id, u.email);
      const books = await Book.find({ owner: u._id });
      console.log('  Books array length:', books.length);
      console.log('  Books details:', books.map(b => ({ id: b._id, title: b.title, isAvailable: b.isAvailable })));
      const trades = await Trade.find({ $or: [{ proposer: u._id }, { receiver: u._id }] });
      console.log('  Trades length:', trades.length);
      console.log('  Trades format:', trades.map(t => ({ id: t._id, status: t.status })));
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
