const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const Trade = require('../models/Trade');
const Book = require('../models/Book');

describe('Message Model', () => {
  let testUser1, testUser2, testBook1, testBook2, testTrade;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookverse-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  beforeEach(async () => {
    // Clear collections
    await Message.deleteMany({});
    await Trade.deleteMany({});
    await Book.deleteMany({});
    await User.deleteMany({});

    // Create test users
    testUser1 = await User.create({
      name: 'Test User 1',
      email: 'testuser1@example.com',
      password: 'password123',
      city: 'New York'
    });

    testUser2 = await User.create({
      name: 'Test User 2',
      email: 'testuser2@example.com',
      password: 'password123',
      city: 'Los Angeles'
    });

    // Create test books
    testBook1 = await Book.create({
      owner: testUser1._id,
      title: 'Test Book 1',
      author: 'Author 1',
      condition: 'Good',
      genre: 'Fiction',
      imageUrl: 'http://example.com/image1.jpg'
    });

    testBook2 = await Book.create({
      owner: testUser2._id,
      title: 'Test Book 2',
      author: 'Author 2',
      condition: 'Like New',
      genre: 'Non-Fiction',
      imageUrl: 'http://example.com/image2.jpg'
    });

    // Create test trade
    testTrade = await Trade.create({
      proposer: testUser1._id,
      receiver: testUser2._id,
      requestedBook: testBook2._id,
      offeredBook: testBook1._id,
      status: 'accepted'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    test('should create a valid message with all required fields', async () => {
      const message = await Message.create({
        trade: testTrade._id,
        sender: testUser1._id,
        content: 'Hello, when can we meet?'
      });

      expect(message).toBeDefined();
      expect(message.trade.toString()).toBe(testTrade._id.toString());
      expect(message.sender.toString()).toBe(testUser1._id.toString());
      expect(message.content).toBe('Hello, when can we meet?');
      expect(message.createdAt).toBeDefined();
      expect(message.createdAt).toBeInstanceOf(Date);
    });

    test('should fail validation when trade is missing', async () => {
      await expect(
        Message.create({
          sender: testUser1._id,
          content: 'Test message'
        })
      ).rejects.toThrow();
    });

    test('should fail validation when sender is missing', async () => {
      await expect(
        Message.create({
          trade: testTrade._id,
          content: 'Test message'
        })
      ).rejects.toThrow();
    });

    test('should fail validation when content is missing', async () => {
      await expect(
        Message.create({
          trade: testTrade._id,
          sender: testUser1._id
        })
      ).rejects.toThrow();
    });

    test('should trim whitespace from content', async () => {
      const message = await Message.create({
        trade: testTrade._id,
        sender: testUser1._id,
        content: '  Hello with spaces  '
      });

      expect(message.content).toBe('Hello with spaces');
    });
  });

  describe('Content Length Validation', () => {
    test('should accept content with exactly 1000 characters', async () => {
      const content = 'a'.repeat(1000);
      const message = await Message.create({
        trade: testTrade._id,
        sender: testUser1._id,
        content
      });

      expect(message.content).toBe(content);
      expect(message.content.length).toBe(1000);
    });

    test('should reject content exceeding 1000 characters', async () => {
      const content = 'a'.repeat(1001);
      
      await expect(
        Message.create({
          trade: testTrade._id,
          sender: testUser1._id,
          content
        })
      ).rejects.toThrow(/cannot exceed 1000 characters/);
    });

    test('should accept content with less than 1000 characters', async () => {
      const content = 'Short message';
      const message = await Message.create({
        trade: testTrade._id,
        sender: testUser1._id,
        content
      });

      expect(message.content).toBe(content);
    });
  });

  describe('References', () => {
    test('should populate trade reference', async () => {
      const message = await Message.create({
        trade: testTrade._id,
        sender: testUser1._id,
        content: 'Test message'
      });

      const populatedMessage = await Message.findById(message._id).populate('trade');
      
      expect(populatedMessage.trade).toBeDefined();
      expect(populatedMessage.trade._id.toString()).toBe(testTrade._id.toString());
      expect(populatedMessage.trade.status).toBe('accepted');
    });

    test('should populate sender reference', async () => {
      const message = await Message.create({
        trade: testTrade._id,
        sender: testUser1._id,
        content: 'Test message'
      });

      const populatedMessage = await Message.findById(message._id).populate('sender');
      
      expect(populatedMessage.sender).toBeDefined();
      expect(populatedMessage.sender._id.toString()).toBe(testUser1._id.toString());
      expect(populatedMessage.sender.name).toBe('Test User 1');
    });

    test('should populate both trade and sender references', async () => {
      const message = await Message.create({
        trade: testTrade._id,
        sender: testUser1._id,
        content: 'Test message'
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('trade')
        .populate('sender');
      
      expect(populatedMessage.trade).toBeDefined();
      expect(populatedMessage.sender).toBeDefined();
    });
  });

  describe('Indexes', () => {
    test('should have index on trade field', () => {
      const indexes = Message.schema.indexes();
      const tradeIndex = indexes.find(index => 
        index[0].trade === 1 && Object.keys(index[0]).length === 1
      );
      
      expect(tradeIndex).toBeDefined();
    });

    test('should have compound index on trade and createdAt', () => {
      const indexes = Message.schema.indexes();
      const compoundIndex = indexes.find(index => 
        index[0].trade === 1 && index[0].createdAt === 1
      );
      
      expect(compoundIndex).toBeDefined();
    });
  });

  describe('Chronological Ordering', () => {
    test('should retrieve messages in chronological order for a trade', async () => {
      // Create messages with slight delays
      const message1 = await Message.create({
        trade: testTrade._id,
        sender: testUser1._id,
        content: 'First message'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const message2 = await Message.create({
        trade: testTrade._id,
        sender: testUser2._id,
        content: 'Second message'
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      const message3 = await Message.create({
        trade: testTrade._id,
        sender: testUser1._id,
        content: 'Third message'
      });

      // Retrieve messages sorted by createdAt
      const messages = await Message.find({ trade: testTrade._id })
        .sort({ createdAt: 1 });

      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('First message');
      expect(messages[1].content).toBe('Second message');
      expect(messages[2].content).toBe('Third message');
      expect(messages[0].createdAt.getTime()).toBeLessThan(messages[1].createdAt.getTime());
      expect(messages[1].createdAt.getTime()).toBeLessThan(messages[2].createdAt.getTime());
    });
  });

  describe('Multiple Trades', () => {
    test('should correctly filter messages by trade', async () => {
      // Create another trade
      const testBook3 = await Book.create({
        owner: testUser1._id,
        title: 'Test Book 3',
        author: 'Author 3',
        condition: 'New',
        genre: 'Science',
        imageUrl: 'http://example.com/image3.jpg'
      });

      const testTrade2 = await Trade.create({
        proposer: testUser2._id,
        receiver: testUser1._id,
        requestedBook: testBook3._id,
        offeredBook: testBook2._id,
        status: 'accepted'
      });

      // Create messages for first trade
      await Message.create({
        trade: testTrade._id,
        sender: testUser1._id,
        content: 'Message for trade 1'
      });

      await Message.create({
        trade: testTrade._id,
        sender: testUser2._id,
        content: 'Another message for trade 1'
      });

      // Create messages for second trade
      await Message.create({
        trade: testTrade2._id,
        sender: testUser2._id,
        content: 'Message for trade 2'
      });

      // Query messages for first trade
      const trade1Messages = await Message.find({ trade: testTrade._id });
      expect(trade1Messages).toHaveLength(2);

      // Query messages for second trade
      const trade2Messages = await Message.find({ trade: testTrade2._id });
      expect(trade2Messages).toHaveLength(1);
    });
  });
});

// API Endpoint Tests
const request = require('supertest');
const app = require('../server');
const { generateToken } = require('../utils/jwt');
const Notification = require('../models/Notification');

describe('Messages API - Send Message', () => {
  let user1, user2, user1Token, user2Token;
  let book1, book2, trade;

  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookverse-test';
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  beforeEach(async () => {
    // Clear collections
    await Message.deleteMany({});
    await Trade.deleteMany({});
    await Book.deleteMany({});
    await User.deleteMany({});
    await Notification.deleteMany({});

    // Create test users
    user1 = await User.create({
      name: 'Test User 1',
      email: 'testuser1@example.com',
      password: 'password123',
      city: 'New York'
    });

    user2 = await User.create({
      name: 'Test User 2',
      email: 'testuser2@example.com',
      password: 'password123',
      city: 'Los Angeles'
    });

    // Generate tokens
    user1Token = generateToken(user1._id);
    user2Token = generateToken(user2._id);

    // Create test books
    book1 = await Book.create({
      owner: user1._id,
      title: 'Test Book 1',
      author: 'Author 1',
      condition: 'Good',
      genre: 'Fiction',
      imageUrl: 'http://example.com/image1.jpg'
    });

    book2 = await Book.create({
      owner: user2._id,
      title: 'Test Book 2',
      author: 'Author 2',
      condition: 'Like New',
      genre: 'Non-Fiction',
      imageUrl: 'http://example.com/image2.jpg'
    });

    // Create accepted trade
    trade = await Trade.create({
      proposer: user1._id,
      receiver: user2._id,
      requestedBook: book2._id,
      offeredBook: book1._id,
      status: 'accepted'
    });
  });

  describe('POST /api/messages', () => {
    test('should send message with valid data', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: trade._id.toString(),
          content: 'Hello, when can we meet?'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.trade).toBe(trade._id.toString());
      expect(response.body.data.sender._id).toBe(user1._id.toString());
      expect(response.body.data.content).toBe('Hello, when can we meet?');
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.message).toBe('Message sent successfully');
    });

    test('should create notification for recipient', async () => {
      await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: trade._id.toString(),
          content: 'Test message'
        })
        .expect(201);

      const notification = await Notification.findOne({ recipient: user2._id });
      expect(notification).toBeDefined();
      expect(notification.type).toBe('new_message');
      expect(notification.relatedTrade.toString()).toBe(trade._id.toString());
      expect(notification.relatedUser.toString()).toBe(user1._id.toString());
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({
          trade: trade._id.toString(),
          content: 'Test message'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should fail with missing trade ID', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'Test message'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    test('should fail with missing content', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: trade._id.toString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    test('should fail with invalid trade ID format', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: 'invalid-id',
          content: 'Test message'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TRADE_ID');
    });

    test('should fail with non-existent trade', async () => {
      const fakeTradeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: fakeTradeId.toString(),
          content: 'Test message'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TRADE_NOT_FOUND');
    });

    test('should fail when user is not part of trade', async () => {
      const user3 = await User.create({
        name: 'Test User 3',
        email: 'testuser3@example.com',
        password: 'password123',
        city: 'Chicago'
      });
      const user3Token = generateToken(user3._id);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user3Token}`)
        .send({
          trade: trade._id.toString(),
          content: 'Test message'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_AUTHORIZED');
    });

    test('should fail when trade status is not accepted', async () => {
      trade.status = 'proposed';
      await trade.save();

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: trade._id.toString(),
          content: 'Test message'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TRADE_STATUS');
    });

    test('should fail with empty content', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: trade._id.toString(),
          content: '   '
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMPTY_CONTENT');
    });

    test('should fail with content exceeding 1000 characters', async () => {
      const longContent = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: trade._id.toString(),
          content: longContent
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONTENT_TOO_LONG');
    });

    test('should trim whitespace from content', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: trade._id.toString(),
          content: '  Hello with spaces  '
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Hello with spaces');
    });

    test('should allow receiver to send message', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          trade: trade._id.toString(),
          content: 'Reply from receiver'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sender._id).toBe(user2._id.toString());
    });

    test('should accept content with exactly 1000 characters', async () => {
      const content = 'a'.repeat(1000);
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          trade: trade._id.toString(),
          content
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content.length).toBe(1000);
    });
  });

  afterAll(async () => {
    // Clean up
    await Message.deleteMany({});
    await Trade.deleteMany({});
    await Book.deleteMany({});
    await User.deleteMany({});
    await Notification.deleteMany({});
  });
});
