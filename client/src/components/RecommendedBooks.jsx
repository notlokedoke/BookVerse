import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookCard from './BookCard';
import './RecommendedBooks.css';

function RecommendedBooks({ limit = 6 }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isColdStart, setIsColdStart] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, [limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`/api/recommendations?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setRecommendations(response.data.data.recommendations);
        setIsColdStart(response.data.data.isColdStart || false);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.response?.data?.error?.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="recommended-books">
        <h2 className="recommended-books__title">Recommended for You</h2>
        <div className="recommended-books__loading">
          <div className="spinner"></div>
          <p>Finding books you'll love...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommended-books">
        <h2 className="recommended-books__title">Recommended for You</h2>
        <div className="recommended-books__error">
          <p>{error}</p>
          <button onClick={fetchRecommendations} className="btn btn--secondary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommended-books">
        <h2 className="recommended-books__title">Recommended for You</h2>
        <div className="recommended-books__empty">
          {isColdStart ? (
            <>
              <p>Start by exploring trending books and adding items to your wishlist for personalized recommendations!</p>
              <button onClick={() => navigate('/browse')} className="btn btn--primary">
                Browse Books
              </button>
            </>
          ) : (
            <>
              <p>No recommendations yet. Add books to your wishlist to get personalized suggestions!</p>
              <button onClick={() => navigate('/wishlist')} className="btn btn--primary">
                Go to Wishlist
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="recommended-books">
      <div className="recommended-books__header">
        <h2 className="recommended-books__title">Recommended for You</h2>
        <button 
          onClick={() => navigate('/browse')} 
          className="recommended-books__view-all"
        >
          View All Books →
        </button>
      </div>

      <div className="recommended-books__grid">
        {recommendations.map((book) => (
          <div key={book._id} className="recommended-books__item">
            <BookCard book={book} showOwner={true} />
            {book.recommendationReason && (
              <div className="recommended-books__reason">
                <span className="recommended-books__reason-icon">✨</span>
                {book.recommendationReason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecommendedBooks;
