/**
 * High-Level Genre List for BookVerse
 * Simplified flat structure with 20 main genres
 */

export const GENRES = [
  { 
    name: 'Fiction', 
    iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: '#8B7355' 
  },
  { 
    name: 'Fantasy', 
    iconPath: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    color: '#9B59B6' 
  },
  { 
    name: 'Science Fiction', 
    iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
    color: '#3498DB' 
  },
  { 
    name: 'Mystery', 
    iconPath: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    color: '#34495E' 
  },
  { 
    name: 'Thriller', 
    iconPath: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#E74C3C' 
  },
  { 
    name: 'Horror', 
    iconPath: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
    color: '#2C3E50' 
  },
  { 
    name: 'Romance', 
    iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    color: '#E91E63' 
  },
  { 
    name: 'Historical Fiction', 
    iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#795548' 
  },
  { 
    name: 'Adventure', 
    iconPath: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    color: '#FF9800' 
  },
  { 
    name: 'Young Adult', 
    iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    color: '#00BCD4' 
  },
  { 
    name: 'Biography', 
    iconPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    color: '#607D8B' 
  },
  { 
    name: 'Memoir', 
    iconPath: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    color: '#78909C' 
  },
  { 
    name: 'Self-Help', 
    iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    color: '#4CAF50' 
  },
  { 
    name: 'History', 
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    color: '#795548' 
  },
  { 
    name: 'Science', 
    iconPath: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    color: '#2196F3' 
  },
  { 
    name: 'Philosophy', 
    iconPath: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    color: '#9E9E9E' 
  },
  { 
    name: 'Business', 
    iconPath: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    color: '#FF5722' 
  },
  { 
    name: 'Poetry', 
    iconPath: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
    color: '#E91E63' 
  },
  { 
    name: 'Graphic Novel', 
    iconPath: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: '#9C27B0' 
  },
  { 
    name: 'Cookbook', 
    iconPath: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    color: '#FF9800' 
  }
];

/**
 * Legacy GENRE_TAXONOMY for backward compatibility
 * Maps to the new flat structure
 */
export const GENRE_TAXONOMY = GENRES.reduce((acc, genre) => {
  acc[genre.name] = {
    icon: genre.icon,
    color: genre.color,
    subgenres: [genre.name]
  };
  return acc;
}, {});

/**
 * Popular genres for quick selection
 */
export const POPULAR_GENRES = [
  'Fiction',
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Horror',
  'Historical Fiction',
  'Biography',
  'Self-Help',
  'Young Adult',
  'Graphic Novel'
];

/**
 * Get all genres as a flat array
 */
export const getAllGenres = () => {
  return GENRES.map(g => g.name).sort();
};

/**
 * Get all subgenres as a flat array (legacy compatibility)
 */
export const getAllSubgenres = getAllGenres;

/**
 * Get genre information by name
 */
export const getGenreInfo = (genreName) => {
  return GENRES.find(g => g.name === genreName) || null;
};

/**
 * Get category information for a specific subgenre (legacy compatibility)
 */
export const getCategoryForSubgenre = (subgenre) => {
  const genre = getGenreInfo(subgenre);
  return genre ? { name: genre.name, icon: genre.icon, color: genre.color } : null;
};

/**
 * Search genres by query string
 */
export const searchGenres = (query) => {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchTerm = query.toLowerCase().trim();
  
  return GENRES
    .filter(genre => genre.name.toLowerCase().includes(searchTerm))
    .map(genre => ({
      subgenre: genre.name,
      category: genre.name,
      icon: genre.icon,
      color: genre.color,
      matchType: 'genre'
    }));
};

/**
 * Get genre statistics (for analytics)
 */
export const getGenreStats = () => {
  return {
    totalGenres: GENRES.length,
    totalCategories: GENRES.length,
    totalSubgenres: GENRES.length
  };
};

/**
 * Validate if a genre exists
 */
export const isValidGenre = (genre) => {
  return GENRES.some(g => g.name === genre);
};

/**
 * Get related genres (random selection excluding current)
 */
export const getRelatedGenres = (genre, limit = 5) => {
  return GENRES
    .filter(g => g.name !== genre)
    .map(g => g.name)
    .slice(0, limit);
};
