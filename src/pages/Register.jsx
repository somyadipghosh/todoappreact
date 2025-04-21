import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp, supabase } from '../lib/supabase';
import Input from '../components/Input';
import Button from '../components/Button';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingUnique, setCheckingUnique] = useState(false);

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear errors when user types
    if (error) {
      setError(null);
    }
  };

  // Check if username or email already exists
  const checkUniqueCredentials = async () => {
    setCheckingUnique(true);
    
    try {
      // Check if username exists
      const { data: usernameData, error: usernameError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', formData.username)
        .maybeSingle();
      
      if (usernameError) throw usernameError;
      
      if (usernameData) {
        setError('Username is already taken. Please choose a different username.');
        setCheckingUnique(false);
        return false;
      }
      
      // Check if email exists
      const { data: emailData, error: emailError } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();
        
      if (emailError) throw emailError;
      
      if (emailData) {
        setError('Email is already registered. Please use a different email or try logging in.');
        setCheckingUnique(false);
        return false;
      }
      
      // Both username and email are unique
      return true;
    } catch (error) {
      console.error('Error checking unique credentials:', error);
      setCheckingUnique(false);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // First check if username and email are unique
      const isUnique = await checkUniqueCredentials();
      if (!isUnique) {
        setLoading(false);
        return;
      }
      
      // Proceed with signup if credentials are unique
      const { data, error, message } = await signUp({
        email: formData.email,
        password: formData.password,
        username: formData.username
      });
      
      if (error) {
        // Check for specific Supabase error codes and provide user-friendly messages
        if (error.message?.includes('email')) {
          throw new Error('This email address is already registered. Please try logging in or use a different email.');
        } else if (error.message?.includes('username')) {
          throw new Error('This username is already taken. Please choose a different username.');
        } else {
          throw error;
        }
      }
      
      // Display success message on the registration page instead of redirecting
      setSuccess(message || "Registration successful! Please check your email to confirm your account. If you don't see the email, please check your spam folder.");
      
      // Clear form data
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error signing up:', error);
      setError(error.message || 'An error occurred during sign up.');
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
          <h1 className="auth-title">Create an account</h1>
          <p className="auth-subtitle">Start managing your tasks today</p>
        </div>
        
        {error && (
          <div className="error-container">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-container">
            {success}
            <div className="mt-4">
              <Link to="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
                Go to login page
              </Link>
            </div>
          </div>
        )}
        
        {!success && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="yourname"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email address</label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                showToggle
              />
              <p className="text-xs text-secondary mt-1">
                Must be at least 6 characters long.
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                showToggle
              />
            </div>

            <Button
              type="submit"
              className="btn-block mt-4"
              disabled={loading || checkingUnique}
            >
              {loading || checkingUnique ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {checkingUnique ? 'Checking...' : 'Signing up...'}
                </>
              ) : (
                'Sign up'
              )}
            </Button>
          </form>
        )}
        
        {!success && (
          <>
            <div className="divider">
              <span className="text-sm text-secondary">or</span>
            </div>
            
            <p className="text-center text-sm text-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;