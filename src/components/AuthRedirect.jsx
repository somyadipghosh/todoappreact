import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        // Extract hash parameters from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        // If we have tokens in the URL, set the session manually
        if (accessToken && refreshToken) {
          console.log('Found tokens in URL, setting session');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) throw sessionError;
          
          // If this is an email confirmation
          if (type === 'signup' || type === 'recovery') {
            console.log('Email confirmation successful');
          }
        }
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Session detected, redirecting to dashboard');
          navigate('/dashboard');
        } else {
          console.log('No session found in URL');
          navigate('/login', { 
            state: { message: 'Authentication failed. Please try logging in again.' } 
          });
        }
      } catch (error) {
        console.error('Error handling auth redirect:', error);
        setError('Error processing authentication. Please try logging in manually.');
        navigate('/login', { 
          state: { error: 'Error processing authentication. Please try logging in manually.' } 
        });
      } finally {
        setLoading(false);
      }
    };

    handleAuthRedirect();
  }, [navigate, location]);

  // Show a loading state
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Processing Authentication...</h2>
          </div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Show error if there was one
  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card error">
          <div className="auth-header">
            <h2>Authentication Error</h2>
          </div>
          <p>{error}</p>
          <button onClick={() => navigate('/login')}>Go to Login</button>
        </div>
      </div>
    );
  }

  // This should not be visible as we navigate away in useEffect
  return null;
};

export default AuthRedirect;