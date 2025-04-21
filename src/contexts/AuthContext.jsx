import { createContext, useState, useEffect, useContext } from 'react';
import { supabase, getCurrentUser, signOut } from '../lib/supabase';

// Create a mock user for demo purposes
const MOCK_USER = {
  id: 'mock-user-id',
  email: 'demo@example.com',
  user_metadata: {
    username: 'Demo User'
  }
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [useMockAuth, setUseMockAuth] = useState(false);

  // Custom logout function to ensure the context is updated
  const logout = async () => {
    try {
      // Clear local storage first
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('user');
      
      // Sign out from Supabase
      const { error } = await signOut();
      if (error) throw error;
      
      // Explicitly update the user state
      setUser(null);
      setUseMockAuth(false);
      setAuthError(null);
      
      // Clear any session cookies
      document.cookie = 'sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      return { error: null };
    } catch (error) {
      console.error('Error during logout:', error);
      return { error };
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Has session' : 'No session');
        
        if (!isSubscribed) return;
        
        try {
          if (session) {
            // If we have a session, we're authenticated
            console.log('Session found, setting user from session');
            setUser(session.user);
          } else {
            // If no session, clear the user
            console.log('No session found, clearing user');
            setUser(null);
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (isSubscribed) {
            setAuthError(error.message);
            // Only use mock auth in development for testing
            if (process.env.NODE_ENV === 'development') {
              console.log('Using mock user in development mode');
              setUser(MOCK_USER);
              setUseMockAuth(true);
            }
          }
        } finally {
          if (isSubscribed) {
            setLoading(false);
          }
        }
      }
    );

    // Check for current user on initial load
    const checkUser = async () => {
      try {
        // First try to get the session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isSubscribed) {
          if (session) {
            console.log('Initial session found, setting user');
            setUser(session.user);
          } else {
            console.log('No initial session found');
            // In development, we might want to use a mock user for testing
            if (process.env.NODE_ENV === 'development') {
              console.log('Using mock user in development mode');
              setUser(MOCK_USER);
              setUseMockAuth(true);
            } else {
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Error checking user:', error);
        if (isSubscribed) {
          setAuthError(error.message);
          // Only use mock auth in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Using mock user in development mode after error');
            setUser(MOCK_USER);
            setUseMockAuth(true);
          }
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    checkUser();

    // Clean up subscription
    return () => {
      isSubscribed = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
    authError,
    useMockAuth,
    isAuthenticated: !!user,
    logout, // Add logout to the context value
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}