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
  try {
    // First, sign up the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      },
    });
    
    if (error) throw error;
    
    // After successful signup, create a profile in our custom table
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: data.user.id,
            username: username,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        
      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // We don't throw here to avoid blocking signup if profile creation fails
        // The profile can be created later
      }
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Error during signup:', err);
    return { data: null, error: err };
  }
};

export const signIn = async ({ identifier, password }) => {
  try {
    // Check if the identifier is an email (contains @ symbol)
    const isEmail = identifier.includes('@');
    
    let result;
    
    if (isEmail) {
      // Login with email
      result = await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      });
    } else {
      // First, find the user with this username
      const { data: userData, error: userError } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('username', identifier)
        .single();
      
      if (userError || !userData) {
        console.error('Username lookup error:', userError);
        return { 
          data: null, 
          error: { message: 'Username not found. Please check your credentials.' } 
        };
      }
      
      // Then login with the found email
      result = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });
    }
    
    const { data, error } = result;
    
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
  try {
    // First update the user metadata in Auth
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });
    
    if (error) throw error;
    
    // Then update the user_profiles table if username is being updated
    if (updates.username && data?.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          username: updates.username,
          updated_at: new Date()
        })
        .eq('id', data.user.id);
      
      if (profileError) {
        console.error('Error updating user profile:', profileError);
        return { data, error: profileError };
      }
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Error updating profile:', err);
    return { data: null, error: err };
  }
};

export const updateEmail = async (newEmail) => {
  try {
    // First update the user email in Auth
    const { data, error } = await supabase.auth.updateUser({
      email: newEmail,
    });
    
    if (error) throw error;
    
    // Then update the user_profiles table
    if (data?.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          email: newEmail,
          updated_at: new Date()
        })
        .eq('id', data.user.id);
      
      if (profileError) {
        console.error('Error updating email in profile:', profileError);
        // We don't throw here because the Auth email update already succeeded
      }
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Error updating email:', err);
    return { data: null, error: err };
  }
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
    // Check if user_profiles table exists or create it
    const { error: profilesError } = await supabase.rpc('create_profiles_table_if_not_exists');
    
    if (profilesError) {
      console.error('Error creating user_profiles table:', profilesError);
      
      // Fallback method: Try to select from the user_profiles table
      const { data: profilesData, error: checkError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
        
      if (checkError) {
        // If table doesn't exist, create it
        const { error: createError } = await supabase.query(`
          CREATE TABLE IF NOT EXISTS user_profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id),
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `);
        
        if (createError) {
          console.error('Error creating user_profiles table:', createError);
        }
      }
    }

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

// Function to create or update user profile after registration
export const createUserProfile = async (user) => {
  if (!user) return { error: new Error('No user data provided') };
  
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: user.id,
          username: user.user_metadata.username,
          email: user.email
        }
      ])
      .select();
      
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { data: null, error };
  }
};