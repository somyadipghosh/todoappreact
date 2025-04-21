import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase, signIn } from '../lib/supabase';
import Input from '../components/Input';
import Button from '../components/Button';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    identifier: '', // can be email or username
    password: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(location?.state?.message || '');

  // Force dark mode for auth pages
  useEffect(() => {
    // Apply dark theme to the document for this page only
    document.body.setAttribute('data-theme', 'dark');
    document.body.classList.add('auth-dark-mode');
    
    // Clean up on unmount
    return () => {
      document.body.classList.remove('auth-dark-mode');
      // When leaving this page, the theme will be reset by other pages
    };
  }, []);

  useEffect(() => {
    // Check if there's already a session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Checking session on Login page:', session ? 'Active session found' : 'No active session');
        
        if (session) {
          console.log('User already logged in, redirecting to dashboard');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    
    checkSession();
    
    if (location?.state?.message) {
      setMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear errors when user types
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Log the attempt (for debugging)
      console.log('Attempting to sign in with:', { identifier: formData.identifier, password: '****' });
      
      const { data, error } = await signIn({
        identifier: formData.identifier,
        password: formData.password
      });
      
      if (error) {
        console.error('Sign in error details:', error);
        throw new Error(error.message || 'An error occurred during sign in');
      }
      
      // Check if we have a session and user
      if (data?.session && data?.user) {
        console.log('Login successful, redirecting to dashboard');
        navigate('/dashboard');
      } else {
        console.warn('No user data returned from sign in', data);
        throw new Error('Authentication failed - No valid session');
      }
    } catch (error) {
      console.error('Error during sign in process:', error);
      setError(error.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  // For testing/debugging
  const checkAuthStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      // Get user if available
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Auth check results:', { 
        hasSession: !!session, 
        hasUser: !!user,
        sessionDetails: session ? {
          expires_at: session.expires_at,
          token_type: session.token_type
        } : null,
        userDetails: user ? {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata
        } : null
      });
      
      if (session) {
        setMessage(`Logged in as: ${user?.email || 'Unknown'}\nSession expires: ${new Date(session.expires_at * 1000).toLocaleString()}`);
      } else {
        setMessage('No active session found. You are not logged in.');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setError(`Auth check failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.35288 8.95043C4.00437 6.17301 6.17301 4.00437 8.95043 3.35288C10.9563 2.88237 13.0437 2.88237 15.0496 3.35288C17.827 4.00437 19.9956 6.17301 20.6471 8.95044C21.1176 10.9563 21.1176 13.0437 20.6471 15.0496C19.9956 17.827 17.827 19.9956 15.0496 20.6471C13.0437 21.1176 10.9563 21.1176 8.95044 20.6471C6.17301 19.9956 4.00437 17.827 3.35288 15.0496C2.88237 13.0437 2.88237 10.9563 3.35288 8.95043Z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 8V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 12H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="auth-title">Sign in to TaskMaster</h1>
          <p className="auth-subtitle">Manage your tasks efficiently</p>
        </div>
        
        {message && (
          <div className="success-message">
            {message}
          </div>
        )}
        
        {error && (
          <div className="error-container">
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="identifier" className="form-label">Username or Email</label>
            <Input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              placeholder="Enter username or email"
              value={formData.identifier}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <div className="flex justify-between mb-1">
              <label htmlFor="password" className="form-label">Password</label>
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-hover transition-colors">Forgot password?</Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              showToggle
            />
          </div>

          <Button
            type="submit"
            className="btn-block mt-4"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
        
        <div className="divider">
          <span className="text-sm text-secondary">or</span>
        </div>
        
        <p className="text-center text-sm text-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Create account
          </Link>
        </p>
        
        <div className="mt-4 text-center">
          <button 
            onClick={checkAuthStatus}
            className="text-xs text-primary hover:underline"
            type="button"
          >
            Check login status
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
