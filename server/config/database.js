const mongoose = require('mongoose');

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
      console.log(`Attempting to connect to MongoDB (Attempt ${attempt}/${retries})...`);
      
      const conn = await mongoose.connect(process.env.MONGODB_URI, options);
      
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log(`Database Name: ${conn.connection.name}`);
      
      // Connection event listeners
      mongoose.connection.on('error', (err) => {
        console.error(`MongoDB connection error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected successfully');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed due to application termination');
        process.exit(0);
      });

      return conn;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed:`, error.message);
      
      if (attempt >= retries) {
        console.error('Max retry attempts reached. Could not connect to MongoDB.');
        throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${error.message}`);
      }
      
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

module.exports = connectDB;
