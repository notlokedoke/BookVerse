const axios = require('axios');

/**
 * Keep Google/Open Library URLs mostly intact with safe normalization only.
 * @param {string|null} url
 * @returns {string|null}
 */
function normalizeCoverUrl(url) {
  if (!url || typeof url !== 'string') return null;

  return url
    .replace(/^http:\/\//i, 'https://')
    .replace('&edge=curl', '');
}

/**
 * Parse dimensions from common image formats using header bytes only.
 * Returns null when dimensions cannot be determined.
 * @param {Buffer} buffer
 * @returns {{ width: number, height: number }|null}
 */
function parseImageDimensions(buffer) {
  if (!buffer || buffer.length < 24) return null;

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return {
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20)
    };
  }

  // GIF87a / GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return {
      width: buffer.readUInt16LE(6),
      height: buffer.readUInt16LE(8)
    };
  }

  // WEBP (RIFF....WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    const chunkType = buffer.toString('ascii', 12, 16);
    if (chunkType === 'VP8X' && buffer.length >= 30) {
      const widthMinusOne = buffer.readUIntLE(24, 3);
      const heightMinusOne = buffer.readUIntLE(27, 3);
      return { width: widthMinusOne + 1, height: heightMinusOne + 1 };
    }
  }

  // JPEG: walk segments until SOF marker
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      // SOF0/SOF2 etc
      if (
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3 ||
        marker === 0xc5 ||
        marker === 0xc6 ||
        marker === 0xc7 ||
        marker === 0xc9 ||
        marker === 0xca ||
        marker === 0xcb ||
        marker === 0xcd ||
        marker === 0xce ||
        marker === 0xcf
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7)
        };
      }

      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }

      const segmentLength = buffer.readUInt16BE(offset + 2);
      if (!segmentLength || segmentLength < 2) break;
      offset += 2 + segmentLength;
    }
  }

  return null;
}

/**
 * Detect suspiciously wide images that are unlikely to be usable covers.
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function isSuspiciouslyWideCover(url) {
  if (!url) return false;

  try {
    // Fetch only initial bytes - enough for headers and lightweight checks.
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 5000,
      headers: {
        Range: 'bytes=0-65535'
      }
    });

    const buffer = Buffer.from(response.data);
    const dimensions = parseImageDimensions(buffer);
    if (!dimensions || !dimensions.width || !dimensions.height) {
      return false;
    }

    const aspectRatio = dimensions.width / dimensions.height;
    // Typical book covers are portrait-ish; very wide banners are suspicious.
    const suspicious = aspectRatio >= 3.5;

    if (suspicious) {
      console.log(
        `[Cover Validation] Suspicious Google cover dimensions: ${dimensions.width}x${dimensions.height}`
      );
    }

    return suspicious;
  } catch (error) {
    // If we cannot determine dimensions, do not block the image.
    return false;
  }
}

/**
 * Lookup book data from Google Books API
 * @param {string} isbn - Clean ISBN (10 or 13 digits)
 * @returns {Promise<Object|null>} Book data or null if not found
 */
async function lookupGoogleBooks(isbn) {
  try {
    if (!process.env.GOOGLE_BOOKS_API_KEY) {
      console.warn('Google Books API key not configured');
      return null;
    }

    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.GOOGLE_BOOKS_API_KEY}`;
    const response = await axios.get(url, { timeout: 8000 });

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    const bookInfo = response.data.items[0].volumeInfo;

    // Get the highest resolution image available
    let coverImage = null;
    if (bookInfo.imageLinks) {
      coverImage = 
        bookInfo.imageLinks.extraLarge ||
        bookInfo.imageLinks.large ||
        bookInfo.imageLinks.medium ||
        bookInfo.imageLinks.small ||
        bookInfo.imageLinks.thumbnail ||
        bookInfo.imageLinks.smallThumbnail ||
        null;
      
      if (coverImage) {
        // Normalize URL (HTTPS, remove curl effect)
        coverImage = normalizeCoverUrl(coverImage);
        
        // Request higher resolution for Google Books images
        // zoom=1 is default (~128px width), zoom=2 is 2x (~256px), zoom=3 is 3x (~384px)
        // We'll use zoom=2 as a good balance between quality and availability
        if (coverImage.includes('books.google')) {
          if (coverImage.includes('zoom=')) {
            // Replace existing zoom with zoom=2
            coverImage = coverImage.replace(/zoom=\d+/, 'zoom=2');
          } else {
            // Add zoom=2 parameter
            const separator = coverImage.includes('?') ? '&' : '?';
            coverImage += `${separator}zoom=2`;
          }
        }
        
        console.log(`[Google Books] Cover image URL: ${coverImage}`);
      }
    }

    return {
      title: bookInfo.title || '',
      author: bookInfo.authors ? bookInfo.authors.join(', ') : '',
      publisher: bookInfo.publisher || '',
      publicationYear: bookInfo.publishedDate ?
        parseInt(bookInfo.publishedDate.split('-')[0]) : null,
      isbn: isbn,
      description: bookInfo.description || '',
      pageCount: bookInfo.pageCount || null,
      categories: bookInfo.categories || [],
      thumbnail: coverImage,
      source: 'Google Books'
    };
  } catch (error) {
    console.error('Google Books lookup error:', error.message);
    return null;
  }
}

/**
 * Lookup book data from Open Library API (PRIMARY AND ONLY SOURCE)
 * @param {string} isbn - Clean ISBN (10 or 13 digits)
 * @returns {Promise<Object>} Book data with success status
 */
async function lookupOpenLibrary(isbn) {
  try {
    // Try the Books API first
    const booksUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const response = await axios.get(booksUrl, { timeout: 8000 });

    const bookKey = `ISBN:${isbn}`;
    if (!response.data[bookKey]) {
      return {
        success: false,
        message: 'Book not found in Open Library'
      };
    }

    const bookInfo = response.data[bookKey];

    // Get cover image - Open Library provides multiple sizes
    // Priority: large > medium > small
    let coverImage = null;
    if (bookInfo.cover) {
      coverImage = bookInfo.cover.large || bookInfo.cover.medium || bookInfo.cover.small || null;
    }

    // If no cover from API, try direct cover URL (often has better quality)
    if (!coverImage) {
      // Open Library provides direct cover access by ISBN
      // Size options: S (small), M (medium), L (large)
      const directCoverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      
      // Verify the cover exists by making a HEAD request
      try {
        await axios.head(directCoverUrl, { timeout: 3000 });
        coverImage = directCoverUrl;
        console.log(`[Open Library] Using direct cover URL: ${directCoverUrl}`);
      } catch (e) {
        // Cover doesn't exist, leave as null
        console.log(`[Open Library] No cover available for ISBN ${isbn}`);
      }
    }

    // Extract authors
    let authors = '';
    if (bookInfo.authors && bookInfo.authors.length > 0) {
      authors = bookInfo.authors.map(a => a.name).join(', ');
    }

    // Extract publication year
    let publicationYear = null;
    if (bookInfo.publish_date) {
      const yearMatch = bookInfo.publish_date.match(/\d{4}/);
      if (yearMatch) {
        publicationYear = parseInt(yearMatch[0]);
      }
    }

    // Extract categories/subjects
    let categories = [];
    if (bookInfo.subjects && bookInfo.subjects.length > 0) {
      categories = bookInfo.subjects.slice(0, 5).map(s => s.name);
    }

    return {
      success: true,
      data: {
        title: bookInfo.title || '',
        author: authors,
        publisher: bookInfo.publishers && bookInfo.publishers.length > 0 ? 
          bookInfo.publishers[0].name : '',
        publicationYear: publicationYear,
        isbn: isbn,
        description: bookInfo.notes || '',
        pageCount: bookInfo.number_of_pages || null,
        categories: categories,
        thumbnail: coverImage,
        source: 'Open Library'
      }
    };
  } catch (error) {
    console.error('Open Library lookup error:', error.message);
    return {
      success: false,
      message: 'Error connecting to Open Library'
    };
  }
}

/**
 * Verify if an image URL is accessible
 * @param {string} url - Image URL to verify
 * @returns {Promise<boolean>} True if image is accessible
 */
async function verifyImageUrl(url) {
  if (!url) return false;
  
  try {
    const response = await axios.head(url, { 
      timeout: 3000,
      validateStatus: (status) => status === 200
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Book lookup using Open Library API only
 * @param {string} isbn - Clean ISBN (10 or 13 digits)
 * @returns {Promise<Object>} Book data with success status
 */
async function bookLookup(isbn) {
  console.log(`[ISBN Lookup] Looking up ISBN: ${isbn} using Open Library`);
  
  const result = await lookupOpenLibrary(isbn);
  
  if (result.success) {
    console.log(`[ISBN Lookup] ✓ Book found: ${result.data.title}`);
  } else {
    console.log(`[ISBN Lookup] ✗ Book not found`);
  }
  
  return result;
}

/**
 * Get book cover image from Open Library
 * @param {string} isbn - Clean ISBN (10 or 13 digits)
 * @returns {Promise<string|null>} Cover image URL or null if not found
 */
async function getCoverImage(isbn) {
  try {
    console.log(`[Cover Lookup] Looking up cover for ISBN: ${isbn}`);
    
    // Try direct cover URL from Open Library
    const directCoverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    
    // Verify the cover exists
    await axios.head(directCoverUrl, { timeout: 3000 });
    console.log(`[Cover Lookup] ✓ Cover found`);
    return directCoverUrl;
  } catch (error) {
    console.log(`[Cover Lookup] ✗ No cover found`);
    return null;
  }
}

module.exports = {
  normalizeCoverUrl,
  lookupOpenLibrary,
  bookLookup,
  getCoverImage,
  verifyImageUrl
};
