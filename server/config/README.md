# Database Configuration

This directory contains the MongoDB connection configuration for the BookVerse application.

## Features

- **Automatic Retry Logic**: Attempts to reconnect up to 5 times with 5-second delays
- **Error Handling**: Comprehensive error logging and graceful failure
- **Connection Monitoring**: Event listeners for connection status changes
- **Graceful Shutdown**: Properly closes database connection on application termination

## Usage

```javascript
const connectDB = require('./config/database');

// Connect to database
await connectDB();
```

## Environment Variables

Ensure the following environment variable is set in your `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/bookverse
```

For production, use MongoDB Atlas or another hosted solution:

```
MONGODB_URI=mongodb+srv://<YOUR_USERNAME>:<YOUR_PASSWORD>@<YOUR_CLUSTER>.mongodb.net/bookverse
```

## Testing the Connection

Run the test script to verify your MongoDB connection:

```bash
node test-db-connection.js
```

## Connection Events

The configuration monitors the following connection events:

- **error**: Logs connection errors
- **disconnected**: Warns when connection is lost
- **reconnected**: Confirms successful reconnection
- **SIGINT**: Gracefully closes connection on application termination

## Troubleshooting

If you see connection errors:

1. **Verify MongoDB is running**:
   ```bash
   # macOS (if installed via Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

2. **Check MongoDB URI**: Ensure `MONGODB_URI` in `.env` is correct

3. **Verify MongoDB is accessible**: Try connecting with MongoDB Compass or mongosh

4. **Check firewall settings**: Ensure port 27017 (or your custom port) is not blocked

## Production Considerations

For production deployments:

- Use MongoDB Atlas or a managed MongoDB service
- Enable authentication and use strong credentials
- Use connection pooling (already configured in mongoose)
- Monitor connection health and set up alerts
- Consider using replica sets for high availability
