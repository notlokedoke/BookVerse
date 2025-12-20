/**
 * Middleware to track Google Places API usage
 * Helps monitor costs and optimize requests
 */

let apiUsageStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  lastReset: new Date(),
  dailyRequests: 0
};

// Reset daily counter at midnight
const resetDailyCounter = () => {
  const now = new Date();
  const lastReset = new Date(apiUsageStats.lastReset);
  
  if (now.getDate() !== lastReset.getDate()) {
    apiUsageStats.dailyRequests = 0;
    apiUsageStats.lastReset = now;
  }
};

const trackAPIUsage = (success = true) => {
  resetDailyCounter();
  
  apiUsageStats.totalRequests++;
  apiUsageStats.dailyRequests++;
  
  if (success) {
    apiUsageStats.successfulRequests++;
  } else {
    apiUsageStats.failedRequests++;
  }
};

const getUsageStats = () => {
  resetDailyCounter();
  
  return {
    ...apiUsageStats,
    successRate: apiUsageStats.totalRequests > 0 
      ? (apiUsageStats.successfulRequests / apiUsageStats.totalRequests * 100).toFixed(2) + '%'
      : '0%',
    estimatedMonthlyCost: (apiUsageStats.dailyRequests * 30 * 0.017).toFixed(2) // $0.017 per request after free tier
  };
};

// Middleware to check if we're approaching limits
const checkUsageLimits = (req, res, next) => {
  resetDailyCounter();
  
  // Warn if approaching free tier limit (1000/month = ~33/day)
  if (apiUsageStats.dailyRequests > 25) {
    console.warn(`⚠️  High API usage today: ${apiUsageStats.dailyRequests} requests`);
  }
  
  // Block if over reasonable daily limit (prevent runaway costs)
  if (apiUsageStats.dailyRequests > 100) {
    return res.status(429).json({
      error: 'Daily API limit reached',
      message: 'Too many city search requests today. Please try again tomorrow.',
      cities: []
    });
  }
  
  next();
};

module.exports = {
  trackAPIUsage,
  getUsageStats,
  checkUsageLimits
};