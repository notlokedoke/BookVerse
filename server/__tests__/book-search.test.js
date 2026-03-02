const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Book = require('../models/Book');

describe('Books API - Search and Filtering', () => {
  let user1, user2, user3, user4;
  let book1, book2, book3, book4, book5, book6;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/bookverse_test');
    }
  });

  beforeEach(async () => {
    // Clear database
    await User.deleteMany({});
    await Book.deleteMany({});

    // Create test users with different cities and privacy settings
    user1 = await User.create({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: 'password123',
      city: 'New York',
      privacySettings: { showCity: true }
    });

    user2 = await User.create({
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'password123',
      city: 'Los Angeles',
      privacySettings: { showCity: true }
    });

    user3 = await User.create({
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      password: 'password123',
      city: 'Chicago',
      privacySettings: { showCity: false } // Private city
    });

    user4 = await User.create({
      name: 'Diana Prince',
      email: 'diana@example.com',
      password: 'password123',
      city: 'New York',
      privacySettings: { showCity: true }
    });

    // Create test books with various attributes
    book1 = await Book.create({
      owner: user1._id,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      genre: ['Fiction', 'Classic'],
      condition: 'Good',
      imageUrl: 'https://example.com/gatsby.jpg',
      isAvailable: true
    });

    book2 = await Book.create({
      owner: user2._id,
      title: '1984',
      author: 'George Orwell',
      genre: ['Fiction', 'Dystopian'],
      condition: 'Like New',
      imageUrl: 'https://example.com/1984.jpg',
      isAvailable: true
    });

    book3 = await Book.create({
      owner: user3._id,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      genre: ['Fiction', 'Classic'],
      condition: 'Good',
      imageUrl: 'https://example.com/mockingbird.jpg',
      isAvailable: true
    });

    book4 = await Book.create({
      owner: user4._id,
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      genre: ['Non-Fiction', 'History'],
      condition: 'New',
      imageUrl: 'https://example.com/sapiens.jpg',
      isAvailable: true
    });

    book5 = await Book.create({
      owner: user1._id,
      title: 'The Catcher in the Rye',
      author: 'J.D. Salinger',
      genre: ['Fiction', 'Classic'],
      condition: 'Fair',
      imageUrl: 'https://example.com/catcher.jpg',
      isAvailable: true
    });

    book6 = await Book.create({
      owner: user2._id,
      title: 'Educated',
      author: 'Tara Westover',
      genre: ['Non-Fiction', 'Memoir'],
      condition: 'Good',
      imageUrl: 'https://example.com/educated.jpg',
      isAvailable: true
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Book.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/books - City Filter', () => {
    test('should filter books by city (case-insensitive)', async () => {
      const response = await request(app)
        .get('/api/books?city=new york')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(3); // book1, book4, book5 from New York users
      
      const titles = response.body.data.books.map(book => book.title);
      expect(titles).toContain('The Great Gatsby');
      expect(titles).toContain('Sapiens');
      expect(titles).toContain('The Catcher in the Rye');
      
      // Verify all books are from New York
      response.body.data.books.forEach(book => {
        expect(book.owner.city).toBe('New York');
      });
    });

    test('should filter books by city with exact case', async () => {
      const response = await request(app)
        .get('/api/books?city=Los Angeles')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2); // book2 and book6 from Los Angeles
      
      const titles = response.body.data.books.map(book => book.title);
      expect(titles).toContain('1984');
      expect(titles).toContain('Educated');
      
      // Verify all books are from Los Angeles
      response.body.data.books.forEach(book => {
        expect(book.owner.city).toBe('Los Angeles');
      });
    });

    test('should not return books from users with private city settings', async () => {
      const response = await request(app)
        .get('/api/books?city=Chicago')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(0); // user3 has showCity: false
    });

    test('should return empty array for city with no books', async () => {
      const response = await request(app)
        .get('/api/books?city=Seattle')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(0);
    });

    test('should handle partial city name match', async () => {
      const response = await request(app)
        .get('/api/books?city=York')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(3); // Matches "New York"
    });
  });

  describe('GET /api/books - Genre Filter', () => {
    test('should filter books by single genre', async () => {
      const response = await request(app)
        .get('/api/books?genre=Fiction')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(4); // book1, book2, book3, book5
      
      // Verify all books have Fiction genre
      response.body.data.books.forEach(book => {
        expect(book.genre).toContain('Fiction');
      });
    });

    test('should filter books by specific genre', async () => {
      const response = await request(app)
        .get('/api/books?genre=Classic')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(3); // book1, book3, book5
      
      const titles = response.body.data.books.map(book => book.title);
      expect(titles).toContain('The Great Gatsby');
      expect(titles).toContain('To Kill a Mockingbird');
      expect(titles).toContain('The Catcher in the Rye');
    });

    test('should filter books by Non-Fiction genre', async () => {
      const response = await request(app)
        .get('/api/books?genre=Non-Fiction')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2); // book4 and book6
      
      const titles = response.body.data.books.map(book => book.title);
      expect(titles).toContain('Sapiens');
      expect(titles).toContain('Educated');
    });

    test('should return empty array for genre with no books', async () => {
      const response = await request(app)
        .get('/api/books?genre=Science Fiction')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(0);
    });

    test('should be case-sensitive for genre matching', async () => {
      const response = await request(app)
        .get('/api/books?genre=fiction')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should return 0 because genre is stored as "Fiction" (capital F)
      expect(response.body.data.books).toHaveLength(0);
    });
  });

  describe('GET /api/books - Author Filter', () => {
    test('should filter books by author (case-insensitive)', async () => {
      const response = await request(app)
        .get('/api/books?author=george orwell')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('1984');
      expect(response.body.data.books[0].author).toBe('George Orwell');
    });

    test('should filter books by partial author name', async () => {
      const response = await request(app)
        .get('/api/books?author=Fitzgerald')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('The Great Gatsby');
      expect(response.body.data.books[0].author).toBe('F. Scott Fitzgerald');
    });

    test('should filter books by first name only', async () => {
      const response = await request(app)
        .get('/api/books?author=Harper')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('To Kill a Mockingbird');
      expect(response.body.data.books[0].author).toBe('Harper Lee');
    });

    test('should filter books by last name only', async () => {
      const response = await request(app)
        .get('/api/books?author=Salinger')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('The Catcher in the Rye');
      expect(response.body.data.books[0].author).toBe('J.D. Salinger');
    });

    test('should return empty array for author with no books', async () => {
      const response = await request(app)
        .get('/api/books?author=Jane Austen')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(0);
    });

    test('should handle special characters in author name', async () => {
      const response = await request(app)
        .get('/api/books?author=J.D.')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].author).toBe('J.D. Salinger');
    });
  });

  describe('GET /api/books - Combined Filters', () => {
    test('should filter by city and genre together', async () => {
      const response = await request(app)
        .get('/api/books?city=New York&genre=Fiction')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2); // book1 and book5
      
      const titles = response.body.data.books.map(book => book.title);
      expect(titles).toContain('The Great Gatsby');
      expect(titles).toContain('The Catcher in the Rye');
      
      // Verify all books match both filters
      response.body.data.books.forEach(book => {
        expect(book.owner.city).toBe('New York');
        expect(book.genre).toContain('Fiction');
      });
    });

    test('should filter by city and author together', async () => {
      const response = await request(app)
        .get('/api/books?city=Los Angeles&author=Orwell')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('1984');
      expect(response.body.data.books[0].owner.city).toBe('Los Angeles');
      expect(response.body.data.books[0].author).toBe('George Orwell');
    });

    test('should filter by genre and author together', async () => {
      const response = await request(app)
        .get('/api/books?genre=Classic&author=Fitzgerald')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('The Great Gatsby');
      expect(response.body.data.books[0].genre).toContain('Classic');
      expect(response.body.data.books[0].author).toBe('F. Scott Fitzgerald');
    });

    test('should filter by city, genre, and author together', async () => {
      const response = await request(app)
        .get('/api/books?city=New York&genre=Classic&author=Fitzgerald')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('The Great Gatsby');
      expect(response.body.data.books[0].owner.city).toBe('New York');
      expect(response.body.data.books[0].genre).toContain('Classic');
      expect(response.body.data.books[0].author).toBe('F. Scott Fitzgerald');
    });

    test('should return empty array when combined filters match no books', async () => {
      const response = await request(app)
        .get('/api/books?city=New York&genre=Non-Fiction&author=Orwell')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(0);
    });

    test('should respect privacy settings when using combined filters', async () => {
      const response = await request(app)
        .get('/api/books?city=Chicago&genre=Fiction')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(0); // user3 has private city
    });

    test('should filter by multiple criteria with partial matches', async () => {
      const response = await request(app)
        .get('/api/books?city=York&genre=Classic&author=Scott')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('The Great Gatsby');
    });
  });

  describe('GET /api/books - Title Filter', () => {
    test('should filter books by title (case-insensitive)', async () => {
      const response = await request(app)
        .get('/api/books?title=gatsby')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].title).toBe('The Great Gatsby');
    });

    test('should filter books by partial title', async () => {
      const response = await request(app)
        .get('/api/books?title=The')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.length).toBeGreaterThan(0);
      
      // All returned books should have "The" in the title
      response.body.data.books.forEach(book => {
        expect(book.title.toLowerCase()).toContain('the');
      });
    });

    test('should combine title filter with other filters', async () => {
      const response = await request(app)
        .get('/api/books?title=The&genre=Classic')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books.length).toBeGreaterThan(0);
      
      response.body.data.books.forEach(book => {
        expect(book.title.toLowerCase()).toContain('the');
        expect(book.genre).toContain('Classic');
      });
    });
  });

  describe('GET /api/books - No Filters', () => {
    test('should return all available books when no filters applied', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(6); // All 6 books
      expect(response.body.data.pagination.totalBooks).toBe(6);
    });

    test('should apply privacy settings to all books', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const chicagoBook = response.body.data.books.find(
        book => book.title === 'To Kill a Mockingbird'
      );
      
      // user3 has private city setting
      expect(chicagoBook.owner.city).toBeUndefined();
      expect(chicagoBook.owner.name).toBe('Charlie Brown');
    });
  });

  describe('GET /api/books - Pagination with Filters', () => {
    test('should paginate filtered results', async () => {
      const response = await request(app)
        .get('/api/books?genre=Fiction&limit=2&page=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalBooks).toBe(4); // 4 Fiction books total
      expect(response.body.data.pagination.totalPages).toBe(2);
      expect(response.body.data.pagination.hasNextPage).toBe(true);
      expect(response.body.data.pagination.hasPrevPage).toBe(false);
    });

    test('should handle second page of filtered results', async () => {
      const response = await request(app)
        .get('/api/books?genre=Fiction&limit=2&page=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(2);
      expect(response.body.data.pagination.currentPage).toBe(2);
      expect(response.body.data.pagination.hasNextPage).toBe(false);
      expect(response.body.data.pagination.hasPrevPage).toBe(true);
    });

    test('should handle pagination with combined filters', async () => {
      const response = await request(app)
        .get('/api/books?city=New York&genre=Classic&limit=1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.pagination.totalBooks).toBe(2); // 2 Classic books in New York
      expect(response.body.data.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/books - Edge Cases', () => {
    test('should handle empty string filters', async () => {
      const response = await request(app)
        .get('/api/books?city=&genre=&author=')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(6); // Should return all books
    });

    test('should handle special characters in filters', async () => {
      const response = await request(app)
        .get('/api/books?author=J.D.%20Salinger')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(1);
      expect(response.body.data.books[0].author).toBe('J.D. Salinger');
    });

    test('should handle URL-encoded filters', async () => {
      const response = await request(app)
        .get('/api/books?city=New%20York')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.books).toHaveLength(3);
    });

    test('should sort results by creation date descending', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify books are sorted by creation date (newest first)
      const books = response.body.data.books;
      for (let i = 0; i < books.length - 1; i++) {
        const currentDate = new Date(books[i].createdAt);
        const nextDate = new Date(books[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });
  });
});
