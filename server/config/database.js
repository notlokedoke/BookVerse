const mongoose = require('mongoose');

// Helper to conditionally log (suppress in test mode)
const log = (...args) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(...args);
  }
};

const logError = (...args) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(...args);
  }
};

const logWarn = (...args) => {
  if (process.env.NODE_ENV !== 'test') {
    console.warn(...args);
  }
};

/**
 * Connect to MongoDB with retry logic
 * @param {number} retries - Number of retry attempts (default: 5)
 * @param {number} delay - Delay between retries in ms (default: 5000)
 */
const connectDB = async (retries = 5, delay = 5000) => {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  let attempt = 0;

  while (attempt < retries) {
    try {
      attempt++;
      log(`Attempting to connect to MongoDB (Attempt ${attempt}/${retries})...`);
      
      const conn = await mongoose.connect(process.env.MONGODB_URI, options);
      
      log(`MongoDB Connected: ${conn.connection.host}`);
      log(`Database Name: ${conn.connection.name}`);
      
      // Connection event listeners
      mongoose.connection.on('error', (err) => {
        logError(`MongoDB connection error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        logWarn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        log('MongoDB reconnected successfully');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        log('MongoDB connection closed due to application termination');
        process.exit(0);
      });

      return conn;
    } catch (error) {
      logError(`MongoDB connection attempt ${attempt} failed:`, error.message);
      
      if (attempt >= retries) {
        logError('Max retry attempts reached. Could not connect to MongoDB.');
        throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${error.message}`);
      }
      
      log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
