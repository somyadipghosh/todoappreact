import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  updateProfile, 
  signOut, 
  updateEmail, 
  updatePassword, 
  deleteAccount,
  saveThemePreference,
  getThemePreference
} from '../lib/supabase';
import Input from '../components/Input';
import Button from '../components/Button';
import './Settings.css';

const Settings = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState(() => getThemePreference());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.user_metadata?.username || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    // Apply theme to document body
    document.body.setAttribute('data-theme', theme);
    saveThemePreference(theme);
  }, [theme]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    // Reset messages
    setMessage('');
    setError('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data, error } = await updateProfile({
        username: formData.username.trim(),
      });

      if (error) throw error;
      
      setMessage('Profile updated successfully!');
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data, error } = await updateEmail(formData.email.trim());
      
      if (error) throw error;
      
      setMessage('Email update initiated. Please check your inbox for verification.');
      if (refreshUser) await refreshUser();
    } catch (err) {
      console.error('Error updating email:', err);
      setError(err.message || 'Failed to update email.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await updatePassword(formData.newPassword);
      
      if (error) throw error;
      
      setMessage('Password updated successfully!');
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { success, error } = await deleteAccount();
      
      if (!success) throw error;
      
      navigate('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Failed to delete account.');
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.username) {
      return user.user_metadata.username.slice(0, 2).toUpperCase();
    } else if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-items-center" style={{ height: '100vh', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>You need to be logged in to view this page.</p>
          <Button onClick={() => navigate('/login')} variant="primary">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="flex-between">
          <div className="dashboard-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            TaskFlow
          </div>
          
          <div className="flex-items-center gap-md">
            <Link to="/dashboard" className="text-secondary hover:text-foreground transition-colors flex-items-center gap-sm" style={{ padding: '0.5rem', borderRadius: '9999px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span className="hidden-mobile">Dashboard</span>
            </Link>
            
            <Button 
              onClick={handleSignOut}
              variant="secondary"
              className="flex-items-center gap-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              <span className="hidden-mobile">Logout</span>
            </Button>
            
            <div className="user-menu">
              <div className="user-avatar">
                {getUserInitials()}
              </div>
              <div className="hidden-mobile">
                <div className="user-name">{user?.user_metadata?.username || 'User'}</div>
                <div className="user-email">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <div style={{ marginBottom: '1.5rem' }}>
          <div className="breadcrumb">
            <Link to="/dashboard">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Settings</span>
          </div>
          <h1 className="dashboard-title flex-items-center gap-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1-2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Account Settings
          </h1>
        </div>

        {message && (
          <div className="notification notification-success">
            <div className="notification-icon">
              <svg className="h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="notification-content">
              <p className="notification-message">{message}</p>
            </div>
            <div className="notification-close">
              <button
                type="button"
                className="notification-close-button"
                onClick={() => setMessage('')}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="notification notification-error">
            <div className="notification-icon">
              <svg className="h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="notification-content">
              <p className="notification-message">{error}</p>
            </div>
            <div className="notification-close">
              <button
                type="button"
                className="notification-close-button"
                onClick={() => setError('')}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="settings-layout">
          <div className="settings-sidebar">
            <div className="sidebar-header">
              <div className="sidebar-user">
                <div className="user-avatar">
                  {getUserInitials()}
                </div>
                <div className="sidebar-user-info">
                  <div className="user-name">{user?.user_metadata?.username || 'User'}</div>
                  <div className="user-email truncate">{user?.email}</div>
                </div>
              </div>
            </div>
            <nav className="sidebar-nav">
              <button 
                onClick={() => handleTabClick('profile')} 
                className={`sidebar-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Profile
              </button>
              <button 
                onClick={() => handleTabClick('account')} 
                className={`sidebar-nav-item ${activeTab === 'account' ? 'active' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Account
              </button>
              <button 
                onClick={() => handleTabClick('security')} 
                className={`sidebar-nav-item ${activeTab === 'security' ? 'active' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Security
              </button>
              <button 
                onClick={() => handleTabClick('appearance')} 
                className={`sidebar-nav-item ${activeTab === 'appearance' ? 'active' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-14a2 2 0 10-.001 0H10zm1 14a1 1 0 100-2 1 1 0 000 2zm5-14a2 2 0 00-2 2v1h2a1 1 0 110 2h-2v2h2a1 1 0 110 2h-2v2h2a1 1 0 110 2h-2v1a2 2 0 002 2h1a1 1 0 100-2h-1V2h-1z" />
                </svg>
                Appearance
              </button>
            </nav>
          </div>
          
          <div className="settings-content">
            <div className="settings-container">
              {/* Profile Section */}
              {activeTab === 'profile' && (
                <div id="profile" className="settings-card">
                  <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Profile Information</h2>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Update your account profile information.</p>
                  
                  <form onSubmit={handleUpdateProfile} className="settings-form">
                    <div className="form-group">
                      <label htmlFor="username" className="form-label">Username</label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Account Section */}
              {activeTab === 'account' && (
                <div id="account" className="settings-card">
                  <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Account Settings</h2>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Update your email address and password.</p>
                  
                  <div className="settings-section">
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Email Address</h3>
                    <form onSubmit={handleUpdateEmail} className="settings-form">
                      <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email address"
                          required
                        />
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={loading}
                        >
                          {loading ? 'Updating...' : 'Update Email'}
                        </Button>
                      </div>
                    </form>
                  </div>

                  <div className="settings-section" style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Change Password</h3>
                    <form onSubmit={handleUpdatePassword} className="settings-form">
                      <div className="form-group">
                        <label htmlFor="currentPassword" className="form-label">Current Password</label>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          placeholder="Enter your current password"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="newPassword" className="form-label">New Password</label>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={handleChange}
                          placeholder="Enter new password"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm new password"
                          required
                        />
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={loading}
                        >
                          {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeTab === 'security' && (
                <div id="security" className="settings-card">
                  <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Security Settings</h2>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Manage your account security and privacy.</p>
                  
                  <div className="settings-section">
                    <div className="danger-zone">
                      <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: '600', color: 'var(--color-danger)' }}>Danger Zone</h3>
                      <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Once you delete your account, there is no going back. Please be certain.</p>
                      
                      {!showDeleteConfirm ? (
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => setShowDeleteConfirm(true)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-2">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Delete Account
                        </Button>
                      ) : (
                        <div className="confirm-delete">
                          <p style={{ marginBottom: '1rem', fontWeight: '500', color: 'var(--color-danger)' }}>Are you sure you want to delete your account?</p>
                          <div className="flex-items-center gap-sm">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => setShowDeleteConfirm(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={handleDeleteAccount}
                              disabled={loading}
                            >
                              {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Section */}
              {activeTab === 'appearance' && (
                <div id="appearance" className="settings-card">
                  <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>Appearance</h2>
                  <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Customize how TaskFlow looks for you.</p>
                  
                  <div className="theme-switcher">
                    <div className="form-group">
                      <label className="form-label">Theme</label>
                      <div className="theme-options">
                        <button 
                          className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                          onClick={() => setTheme('light')}
                        >
                          <div className="theme-preview light">
                            <div className="theme-circle"></div>
                          </div>
                          <span>Light</span>
                        </button>
                        
                        <button 
                          className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                          onClick={() => setTheme('dark')}
                        >
                          <div className="theme-preview dark">
                            <div className="theme-circle"></div>
                          </div>
                          <span>Dark</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="theme-toggle">
                      <label className="toggle-switch">
                        <span>Dark Mode</span>
                        <div className="switch">
                          <input 
                            type="checkbox" 
                            checked={theme === 'dark'} 
                            onChange={toggleTheme} 
                          />
                          <span className="slider"></span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;