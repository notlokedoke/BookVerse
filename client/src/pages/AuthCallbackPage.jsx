import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const handleCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const token = hashParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        navigate('/login?error=' + error);
        return;
      }

      if (token) {
        try {
          localStorage.setItem('token', token);
          const apiUrl = import.meta.env.VITE_API_URL || '';
          const response = await fetch(`${apiUrl}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (cancelled) return;

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.data);
              setToken(token);
              navigate('/dashboard');
            } else {
              throw new Error('Failed to fetch user data');
            }
          } else {
            throw new Error('Failed to authenticate');
          }
        } catch {
          if (cancelled) return;
          localStorage.removeItem('token');
          navigate('/login?error=auth_failed');
        }
      } else {
        navigate('/login');
      }
    };

    handleCallback();
    return () => { cancelled = true; };
  }, [searchParams, navigate, setUser, setToken]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '4px solid #e5e7eb',
        borderTopColor: '#1ABC9C',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ color: '#6b7280' }}>Completing sign in...</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallbackPage;
