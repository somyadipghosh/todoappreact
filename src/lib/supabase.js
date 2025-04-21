import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log warning if environment variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Authentication helpers
export const signUp = async ({ email, password, username }) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });
  return { data, error };
};

export const signIn = async ({ email, password }) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error during sign in:', err);
    return { data: null, error: err };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const updateProfile = async (updates) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });
  return { data, error };
};

export const updateEmail = async (newEmail) => {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  });
  return { data, error };
};

export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
};

export const deleteAccount = async () => {
  // For security reasons, we first sign out the user
  const { error: signOutError } = await signOut();
  
  if (signOutError) {
    console.error("Error signing out:", signOutError);
    return { success: false, error: signOutError };
  }
  
  // In a real app, you would call a server endpoint that uses the Supabase admin API
  // to delete the user since client-side deletion is not available in the Supabase JS client
  // For demo purposes, we'll simulate account deletion with sign out
  return { success: true };
};

// Password reset functionality
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
};

// Theme management with transition effect
export const saveThemePreference = (theme) => {
  // Add transitioning class to html for animation
  document.documentElement.classList.add('theme-transitioning');
  
  // Store the theme preference in localStorage
  localStorage.setItem('theme', theme);
  
  // Apply the theme to the document
  document.body.setAttribute('data-theme', theme);
  
  // Remove transitioning class after animation completes
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 500); // Match this timing with CSS animation duration
};

export const getThemePreference = () => {
  return localStorage.getItem('theme') || 'light'; // Default to light theme
};

// Apply theme on initial load without transition
export const applyInitialTheme = () => {
  const theme = getThemePreference();
  
  // Temporarily add a class to prevent transitions during initial load
  document.body.classList.add('theme-transition-disable');
  
  // Apply theme
  document.body.setAttribute('data-theme', theme);
  
  // Force a repaint to ensure no transitions occur initially
  const _ = document.body.offsetHeight;
  
  // Remove the preventing class to enable transitions afterward
  requestAnimationFrame(() => {
    document.body.classList.remove('theme-transition-disable');
  });
};

// Initialize the database tables we'll need
export const initializeDatabase = async () => {
  try {
    // Check if categories table exists by trying to select from it
    const { data: categoryData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    // If we got an error, the table might not exist, but this is handled in the UI
    if (categoriesError) {
      console.error('Error checking categories table:', categoriesError);
    }

    // Check if todos table exists by trying to select from it
    const { data: todoData, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .limit(1);

    // If we got an error, the table might not exist, but this is handled in the UI
    if (todosError) {
      console.error('Error checking todos table:', todosError);
    }

    return { categoriesError, todosError };
  } catch (error) {
    console.error('Error in database initialization:', error);
    return { categoriesError: error, todosError: error };
  }
};