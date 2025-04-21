import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../lib/supabase';
import Input from '../components/Input';
import Button from '../components/Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    setLoading(true);

    try {
      if (!email) {
        throw new Error('Please enter your email address');
      }

      const { error } = await resetPassword(email);
      
      if (error) {
        throw error;
      }
      
      setMessage('Password reset link sent! Check your email inbox.');
      setEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to send password reset link');
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
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">We'll send you a link to reset your password</p>
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
            <label htmlFor="email" className="form-label">Email address</label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={handleChange}
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
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>
        
        <div className="divider">
          <span className="text-sm text-secondary">or</span>
        </div>
        
        <p className="text-center text-sm text-foreground">
          <Link to="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Back to Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;