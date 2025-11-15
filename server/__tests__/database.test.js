const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Mock mongoose.connect
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    on: jest.fn(),
    close: jest.fn(),
    host: 'localhost',
    name: 'bookverse',
    readyState: 1
  }
}));

describe('Database Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set test environment variable
    process.env.MONGODB_URI = 'mongodb://localhost:27017/bookverse-test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should connect to MongoDB successfully on first attempt', async () => {
    // Mock successful connection
    mongoose.connect.mockResolvedValueOnce({
      connection: {
        host: 'localhost',
        name: 'bookverse-test'
      }
    });

    const result = await connectDB(3, 1000);

    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(
      process.env.MONGODB_URI,
      expect.objectContaining({
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    );
    expect(result).toBeDefined();
  });

  test('should retry connection on failure and succeed', async () => {
    // Mock first attempt fails, second succeeds
    mongoose.connect
      .mockRejectedValueOnce(new Error('Connection failed'))
      .mockResolvedValueOnce({
        connection: {
          host: 'localhost',
          name: 'bookverse-test'
        }
      });

    const result = await connectDB(3, 100);

    expect(mongoose.connect).toHaveBeenCalledTimes(2);
    expect(result).toBeDefined();
  });

  test('should throw error after max retries', async () => {
    // Mock all attempts fail
    mongoose.connect.mockRejectedValue(new Error('Connection refused'));

    await expect(connectDB(3, 100)).rejects.toThrow(
      'Failed to connect to MongoDB after 3 attempts'
    );

    expect(mongoose.connect).toHaveBeenCalledTimes(3);
  });

  test('should set up connection event listeners', async () => {
    mongoose.connect.mockResolvedValueOnce({
      connection: {
        host: 'localhost',
        name: 'bookverse-test'
      }
    });

    await connectDB(3, 1000);

    // Verify event listeners were registered
    expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    expect(mongoose.connection.on).toHaveBeenCalledWith('reconnected', expect.any(Function));
  });
});
