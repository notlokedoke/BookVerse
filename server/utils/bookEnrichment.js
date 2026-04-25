const axios = require('axios');

/**
 * Fetch book description from Google Books API
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @param {string} isbn - Book ISBN (optional but improves accuracy)
 * @returns {Promise<string|null>} - Book description or null
 */
async function fetchDescriptionFromGoogleBooks(title, author, isbn = null) {
  try {
    let query;
    let searchMethod = 'title+author';
    
    // Prefer ISBN for more accurate results
    if (isbn && isbn.trim()) {
      query = `isbn:${isbn.trim()}`;
      searchMethod = 'ISBN';
    } else {
      // Fallback to title + author
      query = `intitle:${title} inauthor:${author}`;
    }

    const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
      params: {
        q: query,
        maxResults: 1
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data.items && response.data.items.length > 0) {
      const book = response.data.items[0];
      const volumeInfo = book.volumeInfo;
      const description = volumeInfo?.description;
      
      // Validate that the result matches our book (especially important for ISBN searches)
      if (searchMethod === 'ISBN') {
        const fetchedTitle = volumeInfo?.title?.toLowerCase() || '';
        const fetchedAuthors = volumeInfo?.authors?.map(a => a.toLowerCase()).join(' ') || '';
        const searchTitle = title.toLowerCase();
        const searchAuthor = author.toLowerCase();
        
        // Check if title is similar (allow for subtitle differences)
        const titleMatch = fetchedTitle.includes(searchTitle.split(':')[0].trim()) || 
                          searchTitle.split(':')[0].trim().includes(fetchedTitle);
        
        // Check if author matches
        const authorMatch = fetchedAuthors.includes(searchAuthor) || 
                           searchAuthor.includes(fetchedAuthors.split(' ')[0]);
        
        if (!titleMatch && !authorMatch) {
          console.log(`⚠ ISBN result doesn't match: "${fetchedTitle}" by ${volumeInfo?.authors?.join(', ')}`);
          console.log(`  Expected: "${title}" by ${author}`);
          console.log(`  Retrying with title+author search...`);
          
          // Retry with title+author instead
          return fetchDescriptionFromGoogleBooks(title, author, null);
        }
      }
      
      if (description && description.trim().length > 0) {
        console.log(`✓ Found description for "${title}" from Google Books (via ${searchMethod})`);
        return description.trim();
      }
    }

    console.log(`✗ No description found for "${title}" on Google Books`);
    return null;

  } catch (error) {
    console.error(`Error fetching description from Google Books for "${title}":`, error.message);
    return null;
  }
}

/**
 * Fetch book cover image from Open Library API
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @param {string} isbn - Book ISBN (optional but improves accuracy)
 * @returns {Promise<string|null>} - Image URL or null
 */
async function fetchImageFromOpenLibrary(title, author, isbn = null) {
  try {
    let imageUrl = null;

    // Try ISBN first (most accurate)
    if (isbn) {
      const isbnClean = isbn.replace(/[-\s]/g, '');
      
      // Try ISBN-13 first, then ISBN-10
      const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbnClean}-L.jpg`;
      
      // Check if image exists
      try {
        const response = await axios.head(coverUrl, { timeout: 5000 });
        if (response.status === 200) {
          imageUrl = coverUrl;
          console.log(`✓ Found cover image for "${title}" from Open Library (ISBN)`);
          return imageUrl;
        }
      } catch (err) {
        // Image doesn't exist, continue to search
      }
    }

    // Fallback: Search by title and author
    const searchQuery = `${title} ${author}`.trim();
    const searchResponse = await axios.get('https://openlibrary.org/search.json', {
      params: {
        q: searchQuery,
        limit: 1
      },
      timeout: 10000
    });

    if (searchResponse.data.docs && searchResponse.data.docs.length > 0) {
      const book = searchResponse.data.docs[0];
      
      // Try to get cover from various ID types
      if (book.cover_i) {
        imageUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
        console.log(`✓ Found cover image for "${title}" from Open Library (search)`);
        return imageUrl;
      }
      
      if (book.isbn && book.isbn.length > 0) {
        imageUrl = `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`;
        console.log(`✓ Found cover image for "${title}" from Open Library (search ISBN)`);
        return imageUrl;
      }
    }

    console.log(`✗ No cover image found for "${title}" on Open Library`);
    return null;

  } catch (error) {
    console.error(`Error fetching image from Open Library for "${title}":`, error.message);
    return null;
  }
}

/**
 * Enrich a book with description and/or image
 * @param {Object} book - Book object with title, author, isbn
 * @param {Object} options - Options for what to fetch
 * @returns {Promise<Object>} - Object with description and imageUrl
 */
async function enrichBook(book, options = { fetchDescription: true, fetchImage: true }) {
  const result = {
    description: null,
    imageUrl: null
  };

  const { title, author, isbn } = book;

  // Fetch description from Google Books
  if (options.fetchDescription) {
    result.description = await fetchDescriptionFromGoogleBooks(title, author, isbn);
  }

  // Fetch image from Open Library
  if (options.fetchImage) {
    result.imageUrl = await fetchImageFromOpenLibrary(title, author, isbn);
  }

  return result;
}

/**
 * Add delay between API calls to respect rate limits
 * @param {number} ms - Milliseconds to wait
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  fetchDescriptionFromGoogleBooks,
  fetchImageFromOpenLibrary,
  enrichBook,
  delay
};
