#!/bin/bash

# Quick Fix Script for Test Failures
# Run this to automatically fix common test issues

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         BookVerse Test Quick Fix Script                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to server directory
cd "$(dirname "$0")/.."

echo "1. Checking MongoDB..."
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB is running"
else
    echo -e "${RED}✗${NC} MongoDB is not running"
    echo "   Starting MongoDB..."
    
    # Try to start MongoDB
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
        echo -e "${GREEN}✓${NC} Started MongoDB with Homebrew"
    else
        echo -e "${YELLOW}⚠${NC} Please start MongoDB manually:"
        echo "   mongod --dbpath /usr/local/var/mongodb"
        exit 1
    fi
fi

echo ""
echo "2. Checking .env.test file..."
if [ -f ".env.test" ]; then
    echo -e "${GREEN}✓${NC} .env.test exists"
else
    echo -e "${YELLOW}⚠${NC} Creating .env.test file..."
    cat > .env.test << 'EOF'
# Test Environment Configuration
NODE_ENV=test
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/bookverse-test
JWT_SECRET=test_jwt_secret_key_for_testing_only
JWT_EXPIRE=24h
GOOGLE_CLIENT_ID=test_google_client_id
GOOGLE_CLIENT_SECRET=test_google_client_secret
CLOUDINARY_CLOUD_NAME=test_cloud_name
CLOUDINARY_API_KEY=test_api_key
CLOUDINARY_API_SECRET=test_api_secret
FRONTEND_URL=http://localhost:3000
EOF
    echo -e "${GREEN}✓${NC} Created .env.test"
fi

echo ""
echo "3. Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
else
    echo -e "${YELLOW}⚠${NC} Installing dependencies..."
    npm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
fi

echo ""
echo "4. Clearing test database..."
mongosh mongodb://127.0.0.1:27017/bookverse-test --eval "db.dropDatabase()" --quiet 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Test database cleared"
else
    echo -e "${YELLOW}⚠${NC} Could not clear test database (this is okay)"
fi

echo ""
echo "5. Running diagnostic..."
node __tests__/diagnose.js

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    READY TO TEST                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Run tests with:"
echo "  npm test"
echo ""
echo "Or run a single test file:"
echo "  npm test -- auth.test.js"
echo ""
