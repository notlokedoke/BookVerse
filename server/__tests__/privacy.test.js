const {
  applyUserPrivacySettings,
  applyBookOwnerPrivacy,
  applyBookOwnerPrivacyToArray
} = require('../utils/privacy');

describe('Privacy Utility Functions', () => {
  const mockUser = {
    _id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    city: 'New York',
    averageRating: 4.5,
    ratingCount: 10,
    createdAt: new Date('2023-01-01'),
    privacySettings: {
      showCity: true
    }
  };

  const mockUserPrivate = {
    ...mockUser,
    privacySettings: {
      showCity: false
    }
  };

  describe('applyUserPrivacySettings', () => {
    test('should return null for null user', () => {
      const result = applyUserPrivacySettings(null);
      expect(result).toBeNull();
    });

    test('should include city when showCity is true', () => {
      const result = applyUserPrivacySettings(mockUser);
      
      expect(result).toEqual({
        _id: 'user123',
        name: 'John Doe',
        city: 'New York',
        averageRating: 4.5,
        ratingCount: 10,
        createdAt: mockUser.createdAt,
        privacySettings: { showCity: true }
      });
      expect(result.email).toBeUndefined();
    });

    test('should hide city when showCity is false', () => {
      const result = applyUserPrivacySettings(mockUserPrivate);
      
      expect(result).toEqual({
        _id: 'user123',
        name: 'John Doe',
        averageRating: 4.5,
        ratingCount: 10,
        createdAt: mockUser.createdAt,
        privacySettings: { showCity: false }
      });
      expect(result.city).toBeUndefined();
      expect(result.email).toBeUndefined();
    });

    test('should include city when privacySettings is undefined', () => {
      const userWithoutPrivacy = { ...mockUser };
      delete userWithoutPrivacy.privacySettings;
      
      const result = applyUserPrivacySettings(userWithoutPrivacy);
      
      expect(result.city).toBe('New York');
    });

    test('should include email when includeEmail option is true', () => {
      const result = applyUserPrivacySettings(mockUser, { includeEmail: true });
      
      expect(result.email).toBe('john@example.com');
    });

    test('should handle default values for rating fields', () => {
      const userWithoutRatings = {
        ...mockUser,
        averageRating: undefined,
        ratingCount: undefined
      };
      
      const result = applyUserPrivacySettings(userWithoutRatings);
      
      expect(result.averageRating).toBe(0);
      expect(result.ratingCount).toBe(0);
    });
  });

  describe('applyBookOwnerPrivacy', () => {
    const mockBook = {
      _id: 'book123',
      title: 'Test Book',
      author: 'Test Author',
      owner: mockUser,
      toObject: () => ({
        _id: 'book123',
        title: 'Test Book',
        author: 'Test Author',
        owner: mockUser
      })
    };

    test('should return null for null book', () => {
      const result = applyBookOwnerPrivacy(null);
      expect(result).toBeNull();
    });

    test('should apply privacy settings to book owner', () => {
      const result = applyBookOwnerPrivacy(mockBook);
      
      expect(result.owner.city).toBe('New York');
      expect(result.owner.email).toBeUndefined();
      expect(result.title).toBe('Test Book');
    });

    test('should hide owner city when privacy is disabled', () => {
      const bookWithPrivateOwner = {
        ...mockBook,
        owner: mockUserPrivate,
        toObject: () => ({
          _id: 'book123',
          title: 'Test Book',
          author: 'Test Author',
          owner: mockUserPrivate
        })
      };
      
      const result = applyBookOwnerPrivacy(bookWithPrivateOwner);
      
      expect(result.owner.city).toBeUndefined();
      expect(result.owner.name).toBe('John Doe');
    });

    test('should handle book without populated owner', () => {
      const bookWithoutOwner = {
        _id: 'book123',
        title: 'Test Book',
        author: 'Test Author',
        owner: 'user123', // Just ID, not populated
        toObject: () => ({
          _id: 'book123',
          title: 'Test Book',
          author: 'Test Author',
          owner: 'user123'
        })
      };
      
      const result = applyBookOwnerPrivacy(bookWithoutOwner);
      
      expect(result.owner).toBe('user123');
      expect(result.title).toBe('Test Book');
    });

    test('should handle plain object without toObject method', () => {
      const plainBook = {
        _id: 'book123',
        title: 'Test Book',
        author: 'Test Author',
        owner: mockUser
      };
      
      const result = applyBookOwnerPrivacy(plainBook);
      
      expect(result.owner.city).toBe('New York');
      expect(result.title).toBe('Test Book');
    });
  });

  describe('applyBookOwnerPrivacyToArray', () => {
    const mockBooks = [
      {
        _id: 'book1',
        title: 'Book 1',
        owner: mockUser,
        toObject: () => ({ _id: 'book1', title: 'Book 1', owner: mockUser })
      },
      {
        _id: 'book2',
        title: 'Book 2',
        owner: mockUserPrivate,
        toObject: () => ({ _id: 'book2', title: 'Book 2', owner: mockUserPrivate })
      }
    ];

    test('should return empty array for non-array input', () => {
      expect(applyBookOwnerPrivacyToArray(null)).toEqual([]);
      expect(applyBookOwnerPrivacyToArray(undefined)).toEqual([]);
      expect(applyBookOwnerPrivacyToArray('not an array')).toEqual([]);
    });

    test('should apply privacy settings to all books in array', () => {
      const result = applyBookOwnerPrivacyToArray(mockBooks);
      
      expect(result).toHaveLength(2);
      expect(result[0].owner.city).toBe('New York'); // First owner shows city
      expect(result[1].owner.city).toBeUndefined(); // Second owner hides city
      expect(result[0].owner.name).toBe('John Doe');
      expect(result[1].owner.name).toBe('John Doe');
    });

    test('should handle empty array', () => {
      const result = applyBookOwnerPrivacyToArray([]);
      expect(result).toEqual([]);
    });
  });
});