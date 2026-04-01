# Book Enrichment Scripts

This directory contains scripts for enriching book data with descriptions and cover images.

## Overview

- **Descriptions**: Fetched from Google Books API
- **Cover Images**: Fetched from Open Library API
- **Automation**: Background job runs continuously

## Migration Script

Use this to enrich existing books in your database.

### Basic Usage

```bash
# Dry run (preview changes without updating)
node server/scripts/enrichExistingBooks.js --dry-run

# Run the migration (updates database)
node server/scripts/enrichExistingBooks.js
```

### Options

```bash
# Only fetch descriptions
node server/scripts/enrichExistingBooks.js --descriptions

# Only fetch images
node server/scripts/enrichExistingBooks.js --images

# Custom batch size (default: 10)
node server/scripts/enrichExistingBooks.js --batch-size=20

# Custom delay between batches in ms (default: 2000)
node server/scripts/enrichExistingBooks.js --delay=3000

# Combine options
node server/scripts/enrichExistingBooks.js --dry-run --batch-size=5 --delay=1000
```

### Examples

```bash
# Preview what would be updated
node server/scripts/enrichExistingBooks.js --dry-run

# Update all books with missing data
node server/scripts/enrichExistingBooks.js

# Only add descriptions (faster)
node server/scripts/enrichExistingBooks.js --descriptions

# Process slowly to avoid rate limits
node server/scripts/enrichExistingBooks.js --batch-size=5 --delay=5000
```

## Background Job

The background job runs automatically when the server starts.

### Configuration

Edit `server/jobs/bookEnrichmentJob.js` to adjust:

- `BATCH_SIZE`: Number of books per run (default: 5)
- `JOB_INTERVAL`: How often to run in milliseconds (default: 5 minutes)
- `DELAY_BETWEEN_BOOKS`: Delay between individual books (default: 1 second)

### How It Works

1. Runs every 5 minutes automatically
2. Processes 5 books at a time
3. Finds books missing descriptions or images
4. Fetches data from APIs
5. Updates the database
6. Logs progress to console

### Monitoring

Check server logs for background job activity:

```
[BookEnrichment] Starting background job (runs every 5 minutes)
[BookEnrichment] Processing 5 books...
[BookEnrichment] Enriching: "Book Title" by Author Name
[BookEnrichment] ✓ Updated "Book Title"
[BookEnrichment] Batch complete: 4 success, 1 failed
```

## API Rate Limits

### Google Books API
- **Limit**: 1,000 requests per day
- **Cost**: Free
- **Recommendation**: Run migration during off-peak hours

### Open Library API
- **Limit**: No official limit, but be respectful
- **Cost**: Free
- **Recommendation**: Use delays between requests

## Troubleshooting

### "No books need enrichment"
All books already have descriptions and images. Great!

### "No data found from APIs"
The book might not be in the API databases. This is normal for obscure books.

### Rate limit errors
Increase the `--delay` parameter or reduce `--batch-size`.

### Connection timeout
Your internet connection might be slow. Increase timeout in `bookEnrichment.js`.

## Best Practices

1. **Always run with --dry-run first** to preview changes
2. **Run during off-peak hours** to avoid rate limits
3. **Monitor the logs** to see progress
4. **Be patient** - enriching thousands of books takes time
5. **Let the background job handle new books** - no need to run migration repeatedly

## File Structure

```
server/
├── scripts/
│   ├── enrichExistingBooks.js    # One-time migration script
│   └── README.md                  # This file
├── jobs/
│   └── bookEnrichmentJob.js      # Background job (runs automatically)
└── utils/
    └── bookEnrichment.js          # API utilities (shared)
```
