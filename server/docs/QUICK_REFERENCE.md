# Book Cover API - Quick Reference

## 🚀 Quick Start

### Import the Utility
```javascript
const { getCoverImage, hybridBookLookup } = require('../utils/bookLookup');
```

### Fetch a Cover Image
```javascript
const cleanIsbn = isbn.replace(/[-\s]/g, '');
const coverUrl = await getCoverImage(cleanIsbn);

if (coverUrl) {
  book.thumbnail = coverUrl;
}
```

### Fetch Complete Book Data
```javascript
const cleanIsbn = isbn.replace(/[-\s]/g, '');
const result = await hybridBookLookup(cleanIsbn);

if (result.success) {
  const { title, author, thumbnail, source } = result.data;
  console.log(`Found from: ${source}`);
}
```

## 📚 Available Functions

### `getCoverImage(isbn)`
**Purpose:** Fetch only the cover image  
**Returns:** `string | null` (cover URL)  
**Use When:** You only need the cover, not full metadata

```javascript
const cover = await getCoverImage('9780134685991');
// Returns: "https://books.google.com/books/content?id=..."
```

### `hybridBookLookup(isbn)`
**Purpose:** Fetch complete book metadata + cover  
**Returns:** `Object` with success, data, sources, message  
**Use When:** Creating a new book listing with ISBN

```javascript
const result = await hybridBookLookup('9780134685991');
// Returns: { success: true, data: {...}, sources: {...}, message: "..." }
```

### `lookupGoogleBooks(isbn)`
**Purpose:** Query only Google Books API  
**Returns:** `Object | null`  
**Use When:** Testing or debugging Google Books specifically

### `lookupOpenLibrary(isbn)`
**Purpose:** Query only Open Library API  
**Returns:** `Object | null`  
**Use When:** Testing or debugging Open Library specifically

### `verifyImageUrl(url)`
**Purpose:** Check if an image URL is accessible  
**Returns:** `boolean`  
**Use When:** Validating user-provided image URLs

## 🎯 Common Use Cases

### 1. Book Creation with ISBN
```javascript
router.post('/api/books', async (req, res) => {
  const { isbn } = req.body;
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  
  const result = await hybridBookLookup(cleanIsbn);
  
  if (result.success) {
    const book = new Book({
      ...result.data,
      userId: req.user.id
    });
    await book.save();
    res.json({ success: true, book });
  }
});
```

### 2. Wishlist Item with Cover
```javascript
router.post('/api/wishlist', async (req, res) => {
  const { title, isbn } = req.body;
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  
  const coverUrl = await getCoverImage(cleanIsbn);
  
  const wishlistItem = new Wishlist({
    title,
    isbn,
    imageUrl: coverUrl || null,
    userId: req.user.id
  });
  
  await wishlistItem.save();
  res.json({ success: true, item: wishlistItem });
});
```

### 3. Batch Cover Updates
```javascript
router.post('/api/books/refresh-covers', async (req, res) => {
  const books = await Book.find({ thumbnail: null });
  
  for (const book of books) {
    if (book.isbn) {
      const cleanIsbn = book.isbn.replace(/[-\s]/g, '');
      const coverUrl = await getCoverImage(cleanIsbn);
      
      if (coverUrl) {
        book.thumbnail = coverUrl;
        await book.save();
      }
    }
  }
  
  res.json({ success: true, updated: books.length });
});
```

## 🔍 Response Formats

### getCoverImage() Response
```javascript
// Success
"https://books.google.com/books/content?id=..."

// Failure
null
```

### hybridBookLookup() Response
```javascript
{
  success: true,
  data: {
    title: "Clean Code",
    author: "Robert C. Martin",
    publisher: "Prentice Hall",
    publicationYear: 2008,
    isbn: "9780132350884",
    description: "...",
    pageCount: 464,
    categories: ["Computers"],
    thumbnail: "https://books.google.com/...",
    source: "Google Books" // or "Open Library" or "Google Books + Open Library (cover fallback)"
  },
  sources: {
    googleBooks: "success", // or "not_found"
    openLibrary: "not_found" // or "success"
  },
  message: "Book data retrieved from Google Books"
}
```

## ⚙️ Configuration

### Environment Variables
```env
# Required for Google Books
GOOGLE_BOOKS_API_KEY=your_api_key_here

# Open Library requires no configuration
```

### Get Google Books API Key
1. Go to https://console.developers.google.com
2. Create project → Enable "Books API"
3. Create credentials → API Key
4. Add to `.env` file

## 🐛 Debugging

### Enable Detailed Logging
Logs are automatically generated:
```
[Cover Lookup] Trying Google Books (primary) for ISBN: 9780134685991
[Cover Lookup] Using Google Books cover
```

### Test with Known ISBNs
```javascript
// Popular book (should work with Google Books)
await getCoverImage('9780134685991'); // Clean Code

// Older book (might need Open Library fallback)
await getCoverImage('9780486284736'); // Pride and Prejudice

// Very old book (likely Open Library only)
await getCoverImage('9780140449136'); // The Odyssey
```

### Check API Status
```javascript
// Test Google Books
const googleResult = await lookupGoogleBooks('9780134685991');
console.log('Google Books:', googleResult ? 'Working' : 'Failed');

// Test Open Library
const openLibResult = await lookupOpenLibrary('9780134685991');
console.log('Open Library:', openLibResult ? 'Working' : 'Failed');
```

## ⚡ Performance Tips

### 1. Clean ISBN Before Lookup
```javascript
// ✅ Good
const cleanIsbn = isbn.replace(/[-\s]/g, '');
await getCoverImage(cleanIsbn);

// ❌ Bad
await getCoverImage('978-0-13-468599-1'); // Hyphens will cause issues
```

### 2. Use getCoverImage() When Possible
```javascript
// ✅ Good - Lightweight, cover only
const cover = await getCoverImage(isbn);

// ❌ Overkill - Full metadata when you only need cover
const result = await hybridBookLookup(isbn);
const cover = result.data?.thumbnail;
```

### 3. Handle Errors Gracefully
```javascript
// ✅ Good
try {
  const cover = await getCoverImage(isbn);
  book.thumbnail = cover || '/placeholder.jpg';
} catch (error) {
  console.error('Cover fetch failed:', error);
  book.thumbnail = '/placeholder.jpg';
}
```

### 4. Batch with Promise.all()
```javascript
// ✅ Good - Parallel
const covers = await Promise.all(
  isbns.map(isbn => getCoverImage(isbn))
);

// ❌ Slow - Sequential
for (const isbn of isbns) {
  const cover = await getCoverImage(isbn);
}
```

## 🚨 Common Errors

### "Google Books API is not configured"
**Solution:** Add `GOOGLE_BOOKS_API_KEY` to `.env`

### "No book found with this ISBN"
**Causes:**
- Invalid ISBN format
- Book not in either database
- Network issues

**Solution:**
```javascript
const result = await hybridBookLookup(isbn);
if (!result.success) {
  console.log(result.message); // Check why it failed
  console.log(result.sources); // See which APIs were tried
}
```

### Timeout Errors
**Solution:** Increase timeout in `bookLookup.js`:
```javascript
const response = await axios.get(url, { timeout: 10000 }); // 10s instead of 8s
```

## 📊 Monitoring

### Track Success Rates
```javascript
let googleSuccess = 0;
let openLibraryFallback = 0;
let totalAttempts = 0;

const result = await hybridBookLookup(isbn);
totalAttempts++;

if (result.sources.googleBooks === 'success') googleSuccess++;
if (result.sources.openLibrary === 'success') openLibraryFallback++;

console.log(`Success Rate: ${(googleSuccess/totalAttempts*100).toFixed(1)}%`);
```

## 📖 Related Documentation

- [Complete Strategy Guide](./BOOK_COVER_STRATEGY.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Sources Comparison](./COVER_SOURCES_COMPARISON.md)

## 💡 Pro Tips

1. **Always clean ISBNs** - Remove hyphens and spaces
2. **Use getCoverImage() for covers only** - It's faster
3. **Handle null gracefully** - Not all books have covers
4. **Log source information** - Helps with debugging
5. **Test with various book types** - Recent, old, academic, etc.

## 🆘 Need Help?

1. Check logs for detailed error messages
2. Verify API key is configured
3. Test with known ISBNs
4. Check network connectivity
5. Review [BOOK_COVER_STRATEGY.md](./BOOK_COVER_STRATEGY.md)
