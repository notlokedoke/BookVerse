# BookVerse Database Management Scripts

This directory contains utility scripts for managing books and data in the BookVerse database.

## Available Scripts

### 1. Check Books (`check-books.js`)

Analyzes book data quality and provides detailed statistics.

**Usage:**
```bash
# Check all books in database
node server/scripts/check-books.js

# Check books for a specific user
node server/scripts/check-books.js 507f1f77bcf86cd799439011
```

**What it shows:**
- Total book count
- Books with placeholder/missing images
- Books missing descriptions or ISBNs
- Duplicate titles
- Genre distribution
- Condition distribution
- Owner distribution
- Recent books (last 10)

**Example Output:**
```
✅ Connected to MongoDB

📊 Checking all books in database

Total books: 100

═══════════════════════════════════════════════════════
📈 DATA QUALITY ANALYSIS
═══════════════════════════════════════════════════════

🖼️  IMAGE ISSUES:
   - Books with placeholder images: 85
   - Books without images: 5
   - Total image issues: 90 (90%)

📝 MISSING DATA:
   - Books without description: 75 (75%)
   - Books without ISBN: 60 (60%)

🔄 DUPLICATE TITLES:
   - "test book": 10 copies
   - "sample book": 8 copies

📚 GENRE DISTRIBUTION:
   - Fiction: 45
   - Non-Fiction: 30
   - Mystery: 15
   - Science Fiction: 10

🏷️  CONDITION DISTRIBUTION:
   - Good: 50
   - Like New: 30
   - New: 20

👤 OWNER DISTRIBUTION:
   - John Doe: 100 books

📅 RECENT BOOKS (Last 10):
   1. "Book Title 1" by Author Name
      Owner: John Doe
      Created: 4/14/2026, 10:30:00 AM
      Image: https://example.com/image.jpg
```

---

### 2. Bulk Delete Books (`bulk-delete-books.js`)

Safely delete multiple books based on various criteria.

**Usage:**

```bash
# Delete all books for a specific user
node server/scripts/bulk-delete-books.js --user 507f1f77bcf86cd799439011

# Delete books with placeholder images
node server/scripts/bulk-delete-books.js --placeholder

# Delete books matching a title pattern
node server/scripts/bulk-delete-books.js --title "Test Book"

# Dry run (preview without deleting)
node server/scripts/bulk-delete-books.js --user 507f1f77bcf86cd799439011 --dry-run
```

**Options:**
- `--user <userId>` - Delete all books owned by a specific user
- `--placeholder` - Delete books with placeholder or missing images
- `--title "pattern"` - Delete books matching title pattern (case-insensitive)
- `--dry-run` - Preview what would be deleted without actually deleting

**Safety Features:**
- ✅ Checks for active trades (won't delete books in active trades)
- ✅ Shows preview of books to be deleted
- ✅ Requires explicit "yes" confirmation
- ✅ Dry-run mode for safe testing

**Example Output:**
```
✅ Connected to MongoDB

Found 100 books owned by user 507f1f77bcf86cd799439011

⚠️  WARNING: 5 active trades involve these books!
These books cannot be deleted until trades are completed or cancelled.

Books with active trades:
  - "Book A" by Author X (John Doe)
  - "Book B" by Author Y (John Doe)

95 books can be safely deleted:

═══════════════════════════════════════════════════════
BOOKS TO BE DELETED:
═══════════════════════════════════════════════════════

1. "Test Book 1" by Test Author
   Owner: John Doe
   Condition: Good
   Image: /placeholder-book.svg
   Created: 4/14/2026, 10:00:00 AM

2. "Test Book 2" by Test Author
   Owner: John Doe
   Condition: Like New
   Image: /placeholder-book.svg
   Created: 4/14/2026, 10:01:00 AM

... and 93 more books

═══════════════════════════════════════════════════════

⚠️  Are you sure you want to delete 95 books? (yes/no): yes

✅ Successfully deleted 95 books
✅ Database connection closed
```

---

## Common Workflows

### Workflow 1: Analyze and Clean Up Test Data

```bash
# Step 1: Check what data exists
node server/scripts/check-books.js

# Step 2: Preview what would be deleted
node server/scripts/bulk-delete-books.js --placeholder --dry-run

# Step 3: Delete placeholder books
node server/scripts/bulk-delete-books.js --placeholder
```

### Workflow 2: Clean Up a Specific User's Books

```bash
# Step 1: Check user's books
node server/scripts/check-books.js 507f1f77bcf86cd799439011

# Step 2: Preview deletion
node server/scripts/bulk-delete-books.js --user 507f1f77bcf86cd799439011 --dry-run

# Step 3: Delete if satisfied
node server/scripts/bulk-delete-books.js --user 507f1f77bcf86cd799439011
```

### Workflow 3: Find and Remove Duplicate Books

```bash
# Step 1: Check for duplicates
node server/scripts/check-books.js

# Step 2: Delete by title pattern
node server/scripts/bulk-delete-books.js --title "Duplicate Book Title"
```

---

## Prerequisites

### Environment Setup

Make sure you have a `.env` file in the `server/` directory with:

```env
MONGODB_URI=mongodb://localhost:27017/bookverse
# or your MongoDB connection string
```

### Dependencies

All required dependencies are already in `package.json`:
- mongoose
- dotenv

---

## Safety Notes

⚠️ **Important Safety Information:**

1. **Always use `--dry-run` first** to preview deletions
2. **Books with active trades cannot be deleted** - the script will skip them
3. **Deletions are permanent** - there is no undo
4. **Backup your database** before bulk operations in production
5. **Test in development** before running in production

---

## Troubleshooting

### Connection Issues

**Problem:** `Error: connect ECONNREFUSED`

**Solution:** 
- Check MongoDB is running: `mongosh` or `mongo`
- Verify MONGODB_URI in `.env` file
- Check network connectivity

### Permission Issues

**Problem:** `MongoServerError: not authorized`

**Solution:**
- Check MongoDB user permissions
- Verify connection string includes credentials
- Ensure user has read/write access to database

### No Books Found

**Problem:** Script shows "No books found"

**Solution:**
- Verify you're connected to the correct database
- Check the user ID is correct (24-character hex string)
- Run without user ID to check all books

---

## Getting User IDs

To find a user's ID for use with these scripts:

### Method 1: From MongoDB Shell
```bash
mongosh
use bookverse
db.users.find({}, { _id: 1, name: 1, email: 1 })
```

### Method 2: From Application Logs
Check server logs when user logs in - the user ID is logged.

### Method 3: From Browser DevTools
1. Log in to the application
2. Open DevTools → Application → Local Storage
3. Look for the JWT token
4. Decode it at jwt.io to see the user ID

---

## Advanced Usage

### Combining with MongoDB Commands

You can combine these scripts with MongoDB commands for more complex operations:

```bash
# Get user ID by email
mongosh bookverse --eval 'db.users.findOne({email: "user@example.com"}, {_id: 1})'

# Then use in script
node server/scripts/check-books.js <userId>
```

### Scheduling Regular Cleanup

You can schedule these scripts with cron (Linux/Mac) or Task Scheduler (Windows):

```bash
# Run cleanup every Sunday at 2 AM
0 2 * * 0 cd /path/to/bookverse && node server/scripts/bulk-delete-books.js --placeholder --dry-run
```

---

## Contributing

When adding new scripts:
1. Follow the existing pattern (dotenv, mongoose connection)
2. Add proper error handling
3. Include dry-run mode for destructive operations
4. Update this README with usage instructions
5. Add safety checks for production data

---

## Support

If you encounter issues:
1. Check the error message carefully
2. Verify your `.env` configuration
3. Ensure MongoDB is running
4. Check you have the correct permissions
5. Try with `--dry-run` first

For bugs or feature requests, please create an issue in the repository.
