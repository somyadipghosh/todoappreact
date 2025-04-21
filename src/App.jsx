import React, { useEffect, useState, useTransition } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useRouteError } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TodoProvider } from './contexts/TodoContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import AuthRedirect from './components/AuthRedirect';
import { initializeDatabase } from './lib/supabase';

function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">Oops!</h1>
        <p className="text-xl text-secondary mb-6">Something went wrong</p>
        <p className="text-sm text-error mb-6">{error?.message || 'Unknown error'}</p>
        <a 
          href="/dashboard" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover transition"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-secondary mb-6">Page not found</p>
        <a 
          href="/dashboard" 
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-hover transition"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}

function AppLayout() {
  return (
    <AuthProvider>
      <TodoProvider>
        <Outlet />
      </TodoProvider>
    </AuthProvider>
  );
}

function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [dbWarningDismissed, setDbWarningDismissed] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const setupDb = async () => {
      try {
        const { categoriesError, todosError } = await initializeDatabase();
        
        if (categoriesError || todosError) {
          // Just log the warning but don't block the app from loading
          console.warn('Database tables might not exist yet, but we can continue:', 
            { categoriesError, todosError });
            
          if (categoriesError?.message?.includes('not initialized') || 
              todosError?.message?.includes('not initialized')) {
            setDbError('Supabase connection could not be established. The app will use mock data instead.');
          } else {
            setDbError('Some database tables may not exist, but the app will continue with available functionality.');
          }
        }
        
        setDbInitialized(true);
      } catch (error) {
        console.error('Error initializing database, but we can continue with mock data:', error);
        setDbError('Database connection issue: ' + error.message + '. The app will use mock data instead.');
        setDbInitialized(true); // Still set as initialized so the app can load
      }
    };

    setupDb();
  }, []);

  // Display a warning banner instead of blocking the whole app
  const renderDbWarning = () => {
    if (!dbError || dbWarningDismissed) return null;
    
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-400 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-lg mx-auto max-w-5xl my-4 flex justify-between items-center">
        <div>
          <p className="font-medium">Database Connection Warning</p>
          <p className="text-sm mt-1">{dbError}</p>
          <p className="text-xs mt-2">
            Your data may not be saved permanently until this issue is resolved, but the app will function normally with temporary data.
          </p>
        </div>
        <button 
          onClick={() => setDbWarningDismissed(true)}
          className="ml-4 p-1.5 rounded-full text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  };

  // If the app is still loading, show a loading spinner
  if (!dbInitialized && isPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-foreground">Loading application...</p>
      </div>
    );
  }

  const [router] = useState(() => 
    createBrowserRouter([
      {
        path: '/',
        element: <AppLayout />,
        errorElement: <ErrorBoundary />,
        children: [
          // Public routes
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
          { path: 'forgot-password', element: <ForgotPassword /> },
          { path: 'reset-password', element: <ResetPassword /> },
          
          // Auth callback route
          { path: 'auth-callback', element: <AuthRedirect /> },
          
          // Protected routes
          { 
            element: <ProtectedRoute />,
            children: [
              { path: 'dashboard', element: <Dashboard /> },
              { path: 'settings', element: <Settings /> }
            ]
          },
          
          // Redirect to dashboard from root
          { index: true, element: <Navigate to="/dashboard" replace /> },
          
          // 404 route
          { path: '*', element: <NotFound /> }
        ]
      }
    ], {
      future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }
    })
  );

  return (
    <>
      {renderDbWarning()}
      <RouterProvider 
        router={router} 
        future={{ 
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }} 
      />
    </>
  );
}

export default App;
