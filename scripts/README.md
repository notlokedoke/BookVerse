# Bulk Book Import Script

Automatically add multiple books to a user's library using ISBNs. The script fetches book details and cover images from Open Library API.

## Features

✅ **Automatic Data Fetching**: Gets title, author, publisher, publication year, description, and cover image from Open Library  
✅ **Duplicate Detection**: Skips books already in the user's library  
✅ **Error Handling**: Continues processing even if some books fail  
✅ **Progress Tracking**: Shows real-time progress and detailed summary  
✅ **High-Quality Covers**: All books get cover images from Open Library  

## Pre-loaded Books

The script comes with **100 curated books** across all categories:
- Fiction & Literature (20 books)
- Mystery & Thriller (10 books)
- Science Fiction (10 books)
- History & Biography (10 books)
- Self-Help & Psychology (10 books)
- Business & Economics (10 books)
- Science & Nature (10 books)
- Philosophy & Religion (5 books)
- Poetry & Drama (5 books)
- Children's & Young Adult (5 books)
- Cookbooks & Food (3 books)
- Art & Photography (2 books)

## Usage

### Step 1: Find Your User Email or ID

You need either:
- Your email address (e.g., `user@example.com`)
- Your user ID from the database

### Step 2: Run the Script

```bash
cd server
node ../scripts/bulk-add-books.js <your-email-or-id>
```

**Examples:**

```bash
# Using email
node ../scripts/bulk-add-books.js john@example.com

# Using user ID
node ../scripts/bulk-add-books.js 507f1f77bcf86cd799439011
```

### Step 3: Wait for Completion

The script will:
1. Connect to MongoDB
2. Find your user account
3. Process each ISBN one by one
4. Fetch book details from Open Library
5. Add books to your library
6. Show a summary report

## What Gets Added

For each book, the script automatically fetches and adds:

- ✅ **Title** - From Open Library
- ✅ **Author** - From Open Library
- ✅ **Cover Image** - High-quality image from Open Library
- ✅ **Publisher** - From Open Library
- ✅ **Publication Year** - From Open Library
- ✅ **Description** - From Open Library
- ✅ **ISBN** - From your list
- ✅ **Genre** - From your list
- ✅ **Condition** - Set to "Good" by default

## Customizing the Book List

### Option 1: Edit the Script Directly

Open `bulk-add-books.js` and modify the `BOOKS_TO_ADD` array:

```javascript
const BOOKS_TO_ADD = [
  { isbn: '9780061120084', genre: ['Classic Fiction'], condition: 'Good' },
  { isbn: '9780451524935', genre: ['Dystopian Fiction'], condition: 'Like New' },
  // Add more books here
];
```

### Option 2: Create Your Own JSON File

1. Create a JSON file with your books (see `books-data.json` for format)
2. Modify the script to read from your JSON file

### Condition Options

You can set any of these conditions:
- `'New'`
- `'Like New'`
- `'Good'`
- `'Fair'`
- `'Poor'`

## Example Output

```
📚 Bulk Book Import Script

========================================

📡 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Looking for user: john@example.com...
✅ Found user: john (john@example.com)

📖 Preparing to add 100 books...

========================================

[1/100] Processing ISBN: 9780061120084
  🔍 Looking up ISBN: 9780061120084...
  ✅ Added: "To Kill a Mockingbird" by Harper Lee
     Cover: ✓

[2/100] Processing ISBN: 9780451524935
  🔍 Looking up ISBN: 9780451524935...
  ✅ Added: "1984" by George Orwell
     Cover: ✓

...

========================================

📊 Import Summary:

   Total books processed:     100
   ✅ Successfully added:      95
   ⏭️  Already in library:     3
   ❌ Failed:                  2

✨ Import complete!
📚 95 books added to john's library.
🖼️  All books have cover images from Open Library.

👋 Database connection closed
```

## Troubleshooting

### "User not found"
- Make sure you're using the correct email or user ID
- Check that the user exists in your database

### "Book not found in Open Library"
- Some ISBNs may not be in Open Library's database
- The script will skip these and continue with others

### "Connection timeout"
- Check your internet connection
- Open Library API might be temporarily unavailable
- The script will retry automatically

### "Duplicate key error"
- The book already exists in your library
- The script automatically skips duplicates

## Notes

- The script adds a 500ms delay between books to avoid rate limiting
- All books are set as "Available" by default
- Cover images are fetched directly from Open Library (high quality)
- The script is safe to run multiple times (skips duplicates)

## Need Help?

If you encounter issues:
1. Check that MongoDB is running
2. Verify your `.env` file has correct `MONGODB_URI`
3. Make sure you're running from the `server` directory
4. Check the error messages for specific issues


---

# Location Features Migration Script

Migrate existing users to support location-based features by adding coordinates and geocoding cities.

## Features

✅ **Automatic Geocoding**: Converts city names to coordinates using Google Maps API  
✅ **Batch Processing**: Handles all users at once  
✅ **Error Handling**: Continues even if some cities fail to geocode  
✅ **Progress Tracking**: Shows real-time progress  
✅ **Index Creation**: Creates necessary database indexes  
✅ **Safe to Re-run**: Skips users who already have coordinates  

## When to Run

Run this script:
- After implementing location-based features
- When upgrading from an older version
- To pre-geocode all user cities
- After importing users from another system

## Prerequisites

1. **MongoDB Connection**: Ensure `MONGODB_URI` is set in `.env`
2. **Google Maps API Key** (optional but recommended): Add `GOOGLE_MAPS_API_KEY` to `.env`

If you don't have a Google Maps API key:
- The script will still run
- Coordinates will be set to `null`
- Cities will be geocoded automatically on first use

## Usage

```bash
cd server
node scripts/migrate-location-features.js
```

## What It Does

1. **Connects to Database**: Establishes MongoDB connection
2. **Finds Users**: Identifies users with cities but no coordinates
3. **Geocodes Cities**: Converts city names to lat/lng coordinates
4. **Updates Database**: Saves coordinates to user records
5. **Creates Indexes**: Adds necessary database indexes
6. **Reports Results**: Shows summary of success/failures

## Example Output

```
🚀 Starting location features migration...

📡 Connecting to database...
✅ Connected to database

🔍 Finding users without coordinates...
📊 Found 45 users to geocode

[1/45] Geocoding: New York, NY...
[1/45] ✅ Success: New York, NY -> (40.7128, -74.0060)

[2/45] Geocoding: Los Angeles, CA...
[2/45] ✅ Success: Los Angeles, CA -> (34.0522, -118.2437)

[3/45] Geocoding: Chicago, IL...
[3/45] ✅ Success: Chicago, IL -> (41.8781, -87.6298)

...

[45/45] Geocoding: Miami, FL...
[45/45] ✅ Success: Miami, FL -> (25.7617, -80.1918)

📊 Migration Summary:
   ✅ Successfully geocoded: 43
   ❌ Failed to geocode: 2

   Failed cities:
   - Invalid City Name
   - Another Bad City

   These will be geocoded automatically on first use.

🔧 Creating indexes...
✅ Indexes created

🎉 Migration complete!
📡 Database connection closed

✨ All done!
```

## Without Google Maps API Key

If you run without `GOOGLE_MAPS_API_KEY`:

```
🚀 Starting location features migration...

📡 Connecting to database...
✅ Connected to database

🔍 Finding users without coordinates...
📊 Found 45 users to geocode

⚠️  Warning: GOOGLE_MAPS_API_KEY not configured
   Coordinates will be set to null and geocoded on first use
   Add GOOGLE_MAPS_API_KEY to .env to geocode now

✅ Migration complete (coordinates will be geocoded on first use)
📡 Database connection closed

✨ All done!
```

## Getting Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Geocoding API
   - Places API (for meetup suggestions)
   - Maps JavaScript API (for frontend maps)
4. Create credentials (API Key)
5. Add to `server/.env`:
   ```env
   GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

## Rate Limiting

The script includes automatic rate limiting:
- 100ms delay between geocoding requests
- Prevents hitting Google Maps API limits
- Safe for large user bases

## Troubleshooting

### "GOOGLE_MAPS_API_KEY not configured"
- **Solution**: Add API key to `.env` or run without it (coordinates will be geocoded on first use)

### "Failed to geocode: [city name]"
- **Cause**: Invalid city name or API error
- **Impact**: City will be geocoded automatically when user uses location features
- **Action**: No action needed, or manually correct city name in database

### "Connection timeout"
- **Cause**: MongoDB connection issue
- **Solution**: Check `MONGODB_URI` in `.env` and ensure MongoDB is running

### "Geocoding API error"
- **Cause**: API quota exceeded or API not enabled
- **Solution**: Check Google Cloud Console for API status and quotas

## Database Changes

The script makes these changes:

1. **Adds `coordinates` field** to User model:
   ```javascript
   coordinates: {
     lat: Number,
     lng: Number
   }
   ```

2. **Creates index** on coordinates:
   ```javascript
   { 'coordinates.lat': 1, 'coordinates.lng': 1 }
   ```

## Safety

- ✅ Safe to run multiple times (skips users with coordinates)
- ✅ Non-destructive (only adds data, doesn't remove)
- ✅ Handles errors gracefully (continues on failure)
- ✅ Provides detailed logging
- ✅ Can be interrupted and resumed

## Performance

- **Small databases** (<100 users): ~10-30 seconds
- **Medium databases** (100-1000 users): ~2-5 minutes
- **Large databases** (1000+ users): ~10-30 minutes

Time depends on:
- Number of users
- Internet connection speed
- Google Maps API response time

## After Migration

Once migration is complete:

1. ✅ Users can use distance-based search
2. ✅ Meetup suggestions will work
3. ✅ City leaderboards will show accurate data
4. ✅ Location notifications will be sent
5. ✅ Nearby books feature will work

## Notes

- Coordinates are city center, not exact addresses (privacy)
- Failed geocoding doesn't break the migration
- Coordinates are cached for performance
- Script can be run again to geocode failed cities
- No user data is lost if migration fails

## Need Help?

If you encounter issues:
1. Check MongoDB connection
2. Verify `.env` configuration
3. Check Google Cloud Console for API status
4. Review error messages in output
5. Check server logs for details
