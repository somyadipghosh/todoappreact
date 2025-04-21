import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTodo } from '../contexts/TodoContext';
import { useAuth } from '../contexts/AuthContext';
import { getThemePreference } from '../lib/supabase';
import CategoryCard from '../components/CategoryCard';
import DefaultColumn from '../components/DefaultColumn';
import Button from '../components/Button';
import Input from '../components/Input';
import './Dashboard.css';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { 
    categories, 
    todos, 
    loading, 
    addCategory, 
    reorderCategories, 
    reorderTodos 
  } = useTodo();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeDragData, setActiveDragData] = useState(null);
  
  // Apply the theme from local storage
  useEffect(() => {
    const theme = getThemePreference();
    document.body.setAttribute('data-theme', theme);
  }, []);

  const categoryIds = categories.map(category => category.id);
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.user_metadata?.username) {
      return user.user_metadata.username.slice(0, 2).toUpperCase();
    } else if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Handle logout - updated to ensure complete logout before navigation
  const handleLogout = async () => {
    try {
      // Call logout and wait for it to complete
      await logout();
      
      // Clear any stored session data in localStorage
      localStorage.removeItem('supabase.auth.token');
      
      // Force a page reload to ensure all state is cleared
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (newCategoryName.trim() === '') return;

    await addCategory({
      name: newCategoryName.trim(),
      color: '#7C5DFA' // Updated to match the new primary color
    });
    
    setNewCategoryName('');
    setIsCreatingCategory(false);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveDragData(active.data.current);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setActiveDragData(null);
      return;
    }

    // Handle category reordering
    if (active.data.current.type === 'category' && over.data.current.type === 'category') {
      const oldIndex = categories.findIndex(cat => cat.id === active.id);
      const newIndex = categories.findIndex(cat => cat.id === over.id);
      
      if (oldIndex !== newIndex) {
        const newOrder = categories[newIndex].order;
        await reorderCategories(active.id, newOrder);
      }
    }
    
    // Handle todo reordering or moving between categories
    if (active.data.current.type === 'todo') {
      const todo = active.data.current.todo;
      
      // If dropped on another todo
      if (over.data.current.type === 'todo') {
        const overTodo = over.data.current.todo;
        const newCategoryId = overTodo.category_id;
        const newOrder = overTodo.order;
        
        if (todo.category_id !== newCategoryId || todo.order !== newOrder) {
          await reorderTodos(todo.id, newCategoryId, newOrder);
        }
      }
      
      // If dropped on a category
      else if (over.data.current.type === 'category') {
        const newCategoryId = over.id;
        
        if (todo.category_id !== newCategoryId) {
          // Get the highest order in this category
          const categoryTodos = todos.filter(t => t.category_id === newCategoryId);
          const highestOrder = categoryTodos.length > 0 
            ? Math.max(...categoryTodos.map(t => t.order))
            : -1;
            
          await reorderTodos(todo.id, newCategoryId, highestOrder + 1);
        }
      }
    }

    setActiveId(null);
    setActiveDragData(null);
  };

  // Determine what to render in the drag overlay
  const renderDragOverlay = () => {
    if (!activeId || !activeDragData) return null;

    if (activeDragData.type === 'category') {
      const category = categories.find(cat => cat.id === activeId);
      if (!category) return null;
      return <CategoryCard category={category} />;
    }
    
    if (activeDragData.type === 'todo') {
      const todo = activeDragData.todo;
      if (!todo) return null;
      return <div className="todo-item">{todo.title}</div>;
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="loading-spinner-inner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Modern App Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="dashboard-logo">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            TaskFlow
          </div>
          
          <div className="header-actions">
            <Link to="/settings" className="header-nav-link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <span>Settings</span>
            </Link>
            
            <Button 
              onClick={handleLogout}
              variant="secondary"
              className="flex-items-center gap-sm logout-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Logout
            </Button>
            
            <div className="user-menu">
              <div className="user-avatar">
                {getUserInitials()}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.user_metadata?.username || 'User'}</div>
                <div className="user-email">{user?.email}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content with enhanced styling */}
      <main className="dashboard-content">
        <div className="dashboard-header-section">
          <h1 className="dashboard-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Dashboard
          </h1>
          <div className="dashboard-date">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      
        {/* Dashboard Grid Layout */}
        <div className="dashboard-grid">
          {/* Default column for tasks without a category */}
          <div className="default-column-wrapper">
            <DefaultColumn />
          </div>

          {/* Categories section */}
          <div className="categories-container">
            <div className="categories-header">
              <h2 className="categories-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                Categories
              </h2>
              
              {!isCreatingCategory && (
                <Button 
                  onClick={() => setIsCreatingCategory(true)}
                  variant="primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  New Category
                </Button>
              )}
            </div>
            
            {/* New category form */}
            {isCreatingCategory && (
              <div className="category-form-container">
                <form onSubmit={handleCreateCategory} className="add-form">
                  <h3 className="form-title">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    New Category
                  </h3>
                  
                  <div className="form-group">
                    <label htmlFor="categoryName" className="form-label">
                      Category Name
                    </label>
                    <Input
                      id="categoryName"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name..."
                      autoFocus
                    />
                  </div>
                  
                  <div className="form-actions">
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => {
                        setNewCategoryName('');
                        setIsCreatingCategory(false);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Create
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Categories list */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="categories-list">
                {categories.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    </div>
                    <div className="empty-state-text">
                      You don't have any categories yet
                    </div>
                    <Button
                      onClick={() => setIsCreatingCategory(true)}
                      variant="primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Create Your First Category
                    </Button>
                  </div>
                ) : (
                  <SortableContext items={categoryIds} strategy={horizontalListSortingStrategy}>
                    {categories.map((category) => (
                      <CategoryCard key={category.id} category={category} />
                    ))}
                  </SortableContext>
                )}
              </div>
              
              <DragOverlay adjustScale={true} className="drag-overlay">
                {renderDragOverlay()}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;