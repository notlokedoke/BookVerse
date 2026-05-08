# Database Setup Guide

This guide walks you through setting up MongoDB Atlas for the BookVerse platform, from account creation to connecting your application.

## Table of Contents

1. [MongoDB Atlas Account Setup](#1-mongodb-atlas-account-setup)
2. [Create a Database Cluster](#2-create-a-database-cluster)
3. [Database User Creation](#3-database-user-creation)
4. [Network Access Configuration](#4-network-access-configuration)
5. [Get Your Connection String](#5-get-your-connection-string)
6. [Configure Application Environment](#6-configure-application-environment)
7. [Verify Connection](#7-verify-connection)
8. [Troubleshooting](#troubleshooting)

---

## 1. MongoDB Atlas Account Setup

MongoDB Atlas is a fully-managed cloud database service that provides a free tier perfect for development and small-scale production deployments.

### Steps:

1. **Visit MongoDB Atlas**: Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Sign Up**: Click "Try Free" or "Sign Up"
   - You can sign up with email or use Google/GitHub authentication
   - Fill in your details and verify your email address

3. **Complete Initial Survey** (Optional): MongoDB may ask about your experience level and use case
   - Select "I'm learning MongoDB" or your appropriate use case
   - Choose "Node.js" as your preferred language

---

## 2. Create a Database Cluster

A cluster is where your database will be hosted. The free tier (M0) provides 512MB of storage, which is sufficient for development.

### Steps:

1. **Create a New Cluster**:
   - After logging in, click "Build a Database" or "Create" button
   - Select the **FREE** tier (M0 Sandbox)

2. **Choose Cloud Provider and Region**:
   - **Provider**: AWS, Google Cloud, or Azure (AWS recommended)
   - **Region**: Choose the region closest to your users or development location
     - Example: `us-east-1` (N. Virginia) for US East Coast
     - Example: `eu-west-1` (Ireland) for Europe
   - Note: Free tier has limited region options

3. **Cluster Name**:
   - Give your cluster a meaningful name (e.g., `BookVerse-Dev` or `BookVerse-Prod`)
   - Default name is usually `Cluster0`

4. **Additional Settings**:
   - Leave MongoDB version as default (latest stable version)
   - Free tier doesn't allow customization of other settings

5. **Create Cluster**:
   - Click "Create Cluster"
   - Cluster creation takes 3-5 minutes

---

## 3. Database User Creation

Database users authenticate your application to access the database. Never use your Atlas account credentials for application connections.

### Steps:

1. **Navigate to Database Access**:
   - In the left sidebar, click "Database Access" under the "Security" section
   - Or click "Security" tab → "Database Access"

2. **Add New Database User**:
   - Click "Add New Database User" button

3. **Authentication Method**:
   - Select "Password" (default and recommended)

4. **User Credentials**:
   - **Username**: Choose a username (e.g., `bookverse-app`, `bookverse-dev`)
   - **Password**: 
     - Click "Autogenerate Secure Password" (recommended) and save it securely
     - Or create a strong password (minimum 8 characters, mix of letters, numbers, symbols)
     - **IMPORTANT**: Save this password immediately - you won't be able to view it again

5. **Database User Privileges**:
   - For development: Select "Read and write to any database"
   - For production: Consider creating custom roles with specific database access
   - Built-in roles available:
     - `Atlas admin`: Full access (not recommended for applications)
     - `Read and write to any database`: Standard application access
     - `Only read any database`: For read-only applications

6. **Restrict Access** (Optional but Recommended):
   - Under "Restrict Access to Specific Clusters/Federated Database Instances"
   - Select your specific cluster to limit user access

7. **Temporary User** (Optional):
   - Set an expiration date if this is a temporary development user
   - Leave blank for permanent users

8. **Add User**:
   - Click "Add User"
   - User creation is immediate

### Best Practices:

- **Development**: Create a separate user (e.g., `bookverse-dev`)
- **Production**: Create a separate user (e.g., `bookverse-prod`) with restricted permissions
- **Never** share database credentials in code or version control
- **Rotate passwords** periodically for production environments
- Use **strong, unique passwords** for each environment

---

## 4. Network Access Configuration

MongoDB Atlas uses IP whitelisting to control which IP addresses can connect to your cluster. This is a critical security feature.

### Steps:

1. **Navigate to Network Access**:
   - In the left sidebar, click "Network Access" under the "Security" section

2. **Add IP Address**:
   - Click "Add IP Address" button

3. **Choose Access Type**:

   **Option A: Allow Access from Anywhere (Development Only)**
   - Click "Allow Access from Anywhere"
   - This adds `0.0.0.0/0` to the whitelist
   - ⚠️ **WARNING**: Only use this for development. Not recommended for production.
   - Useful when:
     - Developing locally with dynamic IP addresses
     - Testing from multiple locations
     - Using cloud deployment platforms with dynamic IPs

   **Option B: Add Your Current IP Address (Recommended for Development)**
   - Click "Add Current IP Address"
   - Automatically detects and adds your current IP
   - More secure than allowing all IPs
   - You'll need to add new IPs when working from different locations

   **Option C: Add Specific IP Address (Production)**
   - Enter a specific IP address or CIDR block
   - Examples:
     - Single IP: `203.0.113.42/32`
     - IP range: `203.0.113.0/24`
   - Use this for:
     - Production servers with static IPs
     - Office networks
     - VPN endpoints

4. **Add Comment** (Optional but Recommended):
   - Add a description (e.g., "Development Machine", "Production Server", "Office Network")
   - Helps identify IPs later

5. **Confirm**:
   - Click "Confirm"
   - Changes take effect immediately (usually within seconds)

### Common Scenarios:

**Local Development**:
```
IP: Your current IP (auto-detected)
Comment: "Local Development - [Your Name]"
```

**Cloud Deployment (Heroku, Vercel, Railway, etc.)**:
```
IP: 0.0.0.0/0
Comment: "Cloud Platform - Dynamic IPs"
```

**Production Server with Static IP**:
```
IP: 203.0.113.42/32
Comment: "Production Server - AWS EC2"
```

### Security Best Practices:

- **Never use `0.0.0.0/0` in production** unless absolutely necessary
- **Document each IP entry** with meaningful comments
- **Remove unused IP addresses** regularly
- **Use VPN or bastion hosts** for production database access
- **Monitor access logs** in Atlas for suspicious activity

---

## 5. Get Your Connection String

The connection string is the URI your application uses to connect to MongoDB Atlas.

### Steps:

1. **Navigate to Database**:
   - Click "Database" in the left sidebar (or "Clusters")
   - You'll see your cluster listed

2. **Connect to Cluster**:
   - Click the "Connect" button on your cluster

3. **Choose Connection Method**:
   - Select "Connect your application"
   - (Other options: Compass GUI, MongoDB Shell, etc.)

4. **Select Driver and Version**:
   - **Driver**: Node.js
   - **Version**: 4.1 or later (BookVerse uses Mongoose 7.8, which is compatible)

5. **Copy Connection String**:
   - You'll see a connection string like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Click "Copy" button

6. **Customize Connection String**:
   - Replace `<username>` with your database username
   - Replace `<password>` with your database user password
   - Add database name after `.net/`: 
     ```
     mongodb+srv://bookverse-app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/bookverse?retryWrites=true&w=majority
     ```

### Connection String Format:

```
mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_ADDRESS>/<DATABASE_NAME>?<OPTIONS>
```

**Components**:
- `mongodb+srv://`: Protocol (SRV record for automatic server discovery)
- `<USERNAME>`: Database user (from Step 3)
- `<PASSWORD>`: Database user password (URL-encoded if contains special characters)
- `<CLUSTER_ADDRESS>`: Your cluster hostname (e.g., `cluster0.abc123.mongodb.net`)
- `<DATABASE_NAME>`: Database name (e.g., `bookverse`, `bookverse-dev`, `bookverse-prod`)
- `<OPTIONS>`: Query parameters (e.g., `retryWrites=true&w=majority`)

### Special Characters in Password:

If your password contains special characters, you must URL-encode them:

| Character | Encoded |
|-----------|---------|
| `@`       | `%40`   |
| `:`       | `%3A`   |
| `/`       | `%2F`   |
| `?`       | `%3F`   |
| `#`       | `%23`   |
| `[`       | `%5B`   |
| `]`       | `%5D`   |
| `%`       | `%25`   |

**Example**:
- Password: `P@ssw0rd!`
- Encoded: `P%40ssw0rd!`
- Connection String: `mongodb+srv://bookverse-app:P%40ssw0rd!@cluster0.xxxxx.mongodb.net/bookverse`

---

## 6. Configure Application Environment

Now that you have your connection string, configure the BookVerse application to use it.

### Steps:

1. **Navigate to Server Directory**:
   ```bash
   cd server
   ```

2. **Create Environment File**:
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Or create a new `.env` file manually

3. **Edit `.env` File**:
   - Open `server/.env` in your text editor
   - Find the `MONGODB_URI` variable

4. **Add Your Connection String**:
   ```env
   # Database
   MONGODB_URI=mongodb+srv://bookverse-app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/bookverse?retryWrites=true&w=majority
   ```

5. **Configure Other Required Variables**:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # Database
   MONGODB_URI=mongodb+srv://bookverse-app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/bookverse?retryWrites=true&w=majority

   # JWT Configuration (generate a secure random string)
   JWT_SECRET=your_secure_random_string_here_min_32_chars
   JWT_EXPIRE=24h

   # Cloudinary Configuration (required for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

6. **Secure Your `.env` File**:
   - Verify `.env` is in `.gitignore` (it should be by default)
   - Never commit `.env` to version control
   - Keep separate `.env` files for different environments

### Environment-Specific Configuration:

**Development** (`server/.env`):
```env
NODE_ENV=development
MONGODB_URI=mongodb+srv://bookverse-dev:DEV_PASSWORD@cluster0.xxxxx.mongodb.net/bookverse-dev
FRONTEND_URL=http://localhost:3000
```

**Production** (Set in hosting platform):
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://bookverse-prod:PROD_PASSWORD@cluster0.xxxxx.mongodb.net/bookverse
FRONTEND_URL=https://yourdomain.com
```

### Security Checklist:

- ✅ `.env` file is in `.gitignore`
- ✅ Different database users for dev/prod
- ✅ Different database names for dev/prod
- ✅ Strong, unique JWT_SECRET (minimum 32 characters)
- ✅ All sensitive credentials are in `.env`, not in code
- ✅ `.env.example` has placeholder values only

---

## 7. Verify Connection

Test that your application can successfully connect to MongoDB Atlas.

### Steps:

1. **Start the Server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Check Console Output**:
   - Look for successful connection messages:
     ```
     Attempting to connect to MongoDB (Attempt 1/5)...
     MongoDB Connected: cluster0-shard-00-01.xxxxx.mongodb.net
     Database Name: bookverse
     Server running on port 5000
     ```

3. **Successful Connection Indicators**:
   - ✅ "MongoDB Connected" message appears
   - ✅ Cluster host is displayed
   - ✅ Database name is correct
   - ✅ No error messages
   - ✅ Server starts successfully

4. **Test API Endpoints**:
   - Open your browser or use curl/Postman
   - Test a simple endpoint:
     ```bash
     curl http://localhost:5000/api/health
     ```
   - Or visit `http://localhost:3000` after starting the client

5. **Verify in MongoDB Atlas**:
   - Go to your Atlas dashboard
   - Click "Database" → "Browse Collections"
   - You should see your database (`bookverse`) listed
   - Collections will be created automatically when data is first inserted

### Connection Retry Logic:

BookVerse includes automatic retry logic (5 attempts with 5-second delays):
- If connection fails temporarily, the app will retry automatically
- Check console for retry attempt messages
- If all retries fail, check your connection string and network access settings

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "MongoServerError: bad auth: Authentication failed"

**Cause**: Incorrect username or password in connection string.

**Solutions**:
- Verify username matches the database user created in Step 3
- Check password is correct (case-sensitive)
- Ensure special characters in password are URL-encoded
- Try resetting the database user password in Atlas:
  - Database Access → Edit User → Edit Password

#### 2. "MongooseServerSelectionError: Could not connect to any servers"

**Cause**: Network access issue - your IP is not whitelisted.

**Solutions**:
- Add your current IP address in Network Access (Step 4)
- If using "Allow Access from Anywhere", wait 1-2 minutes for changes to propagate
- Check your internet connection
- Verify you're not behind a restrictive firewall
- Try using a different network (mobile hotspot) to test

#### 3. "MongoParseError: Invalid connection string"

**Cause**: Malformed connection string.

**Solutions**:
- Verify connection string format:
  ```
  mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database
  ```
- Check for missing components (username, password, cluster address, database name)
- Ensure no extra spaces or line breaks in `.env` file
- Verify special characters are properly URL-encoded

#### 4. Connection String with Special Characters

**Problem**: Password contains `@`, `:`, or other special characters.

**Solution**: URL-encode special characters:
```javascript
// Example password: P@ss:word
// Encoded: P%40ss%3Aword
MONGODB_URI=mongodb+srv://user:P%40ss%3Aword@cluster.mongodb.net/bookverse
```

#### 5. "ENOTFOUND" or DNS Resolution Errors

**Cause**: DNS cannot resolve cluster hostname.

**Solutions**:
- Check internet connection
- Try using `mongodb://` instead of `mongodb+srv://` (requires full host list)
- Flush DNS cache:
  - Windows: `ipconfig /flushdns`
  - Mac: `sudo dscacheutil -flushcache`
  - Linux: `sudo systemd-resolve --flush-caches`
- Check if your network blocks MongoDB ports (27017)

#### 6. Connection Timeout

**Cause**: Firewall blocking MongoDB ports or slow network.

**Solutions**:
- Increase timeout in connection options (already set to 5000ms in BookVerse)
- Check corporate/school firewall settings
- Try different network (mobile hotspot)
- Verify cluster is running in Atlas dashboard

#### 7. "Database Name Not Specified"

**Cause**: Missing database name in connection string.

**Solution**: Add database name after cluster address:
```
mongodb+srv://user:pass@cluster.mongodb.net/bookverse
                                              ^^^^^^^^^ add this
```

#### 8. Environment Variables Not Loading

**Cause**: `.env` file not found or not loaded properly.

**Solutions**:
- Verify `.env` file exists in `server/` directory
- Check file is named exactly `.env` (not `.env.txt`)
- Restart the server after editing `.env`
- Verify `dotenv` is configured in `server.js`:
  ```javascript
  require('dotenv').config();
  ```

#### 9. Multiple Database Connections

**Problem**: Accidentally connecting to wrong database.

**Solution**: Check database name in connection string matches your intent:
- Development: `bookverse-dev`
- Production: `bookverse` or `bookverse-prod`
- Testing: `bookverse-test`

#### 10. Free Tier Limitations

**Issue**: Free tier (M0) has limitations.

**Limitations**:
- 512 MB storage
- Shared RAM
- No backups
- Limited connections (500 concurrent)
- No performance insights

**Solution**: Upgrade to M10+ for production use.

---

## Additional Resources

### MongoDB Atlas Documentation
- [Getting Started Guide](https://docs.atlas.mongodb.com/getting-started/)
- [Connection Strings](https://docs.mongodb.com/manual/reference/connection-string/)
- [Security Best Practices](https://docs.atlas.mongodb.com/security/)

### BookVerse Documentation
- `server/.env.example` - Environment variable reference
- `server/config/database.js` - Connection configuration
- `API_DOCUMENTATION.md` - API endpoints reference

### Mongoose Documentation
- [Mongoose Connection Guide](https://mongoosejs.com/docs/connections.html)
- [Mongoose Models](https://mongoosejs.com/docs/models.html)

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Create separate production database user with strong password
- [ ] Use separate database name (e.g., `bookverse` or `bookverse-prod`)
- [ ] Configure specific IP whitelist (avoid `0.0.0.0/0`)
- [ ] Enable MongoDB Atlas backup (requires paid tier)
- [ ] Set up monitoring and alerts in Atlas
- [ ] Use environment variables in hosting platform (not `.env` file)
- [ ] Enable connection string encryption in transit (default with `mongodb+srv://`)
- [ ] Review and apply security best practices
- [ ] Test connection from production environment
- [ ] Set up database indexes for performance (handled by Mongoose schemas)
- [ ] Configure appropriate read/write concerns for your use case
- [ ] Plan for database scaling (upgrade from M0 free tier)

---

## Support

If you encounter issues not covered in this guide:

1. **Check MongoDB Atlas Status**: [status.mongodb.com](https://status.mongodb.com)
2. **Review Server Logs**: Check console output for detailed error messages
3. **MongoDB Community Forums**: [community.mongodb.com](https://community.mongodb.com)
4. **BookVerse Issues**: Check project documentation or contact development team

---

**Last Updated**: 2024
**MongoDB Atlas Version**: Current
**BookVerse Version**: 1.0
**Mongoose Version**: 7.8
