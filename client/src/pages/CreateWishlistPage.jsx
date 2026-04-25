import React from 'react';
import { useNavigate } from 'react-router-dom';
import WishlistForm from '../components/WishlistForm';

const CreateWishlistPage = () => {
  const navigate = useNavigate();

  const handleSuccess = (wishlistItem) => {
    // Redirect to wishlist page after successful creation
    navigate('/wishlist');
  };

  const handleCancel = () => {
    // Navigate back to wishlist page
    navigate('/wishlist');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#fafafa', 
      padding: '2rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '600px',
        marginTop: '2rem'
      }}>
        <WishlistForm 
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      </div>
    </div>
  );
};

export default CreateWishlistPage;