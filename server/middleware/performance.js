const mongoose = require('mongoose');

/**
 * Database performance monitoring middleware
 * Logs slow queries and provides performance insights
 */

// Track query performance
const queryPerformanceTracker = () => {
  // Monitor slow queries
  mongoose.set('debug', (collectionName, method, query, doc, options) => {
    const start = Date.now();
    
    // Log the query in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`MongoDB Query: ${collectionName}.${method}`, {
        query: JSON.stringify(query),
        options: JSON.stringify(options)
      });
    }
  });

  // Set up query performance monitoring
  mongoose.plugin((schema) => {
    schema.pre(/^find/, function() {
      this.start = Date.now();
    });

    schema.post(/^find/, function() {
      if (this.start) {
        const duration = Date.now() - this.start;
        
        // Log slow queries (over 2 seconds)
        if (duration > 2000) {
          console.warn(`Slow MongoDB query detected: ${this.getQuery()} took ${duration}ms`);
        }
        
        // Log all queries in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Query completed in ${duration}ms`);
        }
      }
    });

    schema.pre('save', function() {
      this.start = Date.now();
    });

    schema.post('save', function() {
      if (this.start) {
        const duration = Date.now() - this.start;
        
        // Log slow saves (over 2 seconds)
        if (duration > 2000) {
          console.warn(`Slow MongoDB save detected: ${this.constructor.modelName} took ${duration}ms`);
        }
        
        // Log all saves in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Save completed in ${duration}ms`);
        }
      }
    });
  });
};

/**
 * API response time monitoring middleware
 */
const apiPerformanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    // Add performance headers
    res.set('X-Response-Time', `${duration}ms`);
    
    // Log slow API responses (over 3 seconds)
    if (duration > 3000) {
      console.warn(`Slow API response: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    }
    
    // Call original json method
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Database connection monitoring
 */
const monitorDatabaseConnection = () => {
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
  });

  // Monitor connection pool
  mongoose.connection.on('fullsetup', () => {
    console.log('📊 MongoDB replica set connection established');
  });
};

/**
 * Memory usage monitoring
 */
const monitorMemoryUsage = () => {
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };
      
      // Log memory usage every 5 minutes
      console.log('Memory Usage (MB):', memUsageMB);
      
      // Warn if memory usage is high
      if (memUsageMB.heapUsed > 500) {
        console.warn('⚠️ High memory usage detected:', memUsageMB);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }
};

module.exports = {
  queryPerformanceTracker,
  apiPerformanceMonitor,
  monitorDatabaseConnection,
  monitorMemoryUsage
};