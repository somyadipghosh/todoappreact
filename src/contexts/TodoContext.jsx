import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Mock data for when Supabase connection fails
const MOCK_CATEGORIES = [
  { id: 'mock-cat-1', name: 'Work', color: '#3B82F6', order: 0 },
  { id: 'mock-cat-2', name: 'Personal', color: '#10B981', order: 1 },
  { id: 'mock-cat-3', name: 'Shopping', color: '#F59E0B', order: 2 },
];

const MOCK_TODOS = [
  { id: 'mock-todo-1', title: 'Complete project proposal', completed: false, category_id: 'mock-cat-1', order: 0 },
  { id: 'mock-todo-2', title: 'Schedule team meeting', completed: true, category_id: 'mock-cat-1', order: 1 },
  { id: 'mock-todo-3', title: 'Go for a run', completed: false, category_id: 'mock-cat-2', order: 0 },
  { id: 'mock-todo-4', title: 'Buy groceries', completed: false, category_id: 'mock-cat-3', order: 0 },
];

const TodoContext = createContext();

export function TodoProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usesMockData, setUsesMockData] = useState(false);
  const [dataFetchAttempted, setDataFetchAttempted] = useState(false);

  // Fetch categories when user is authenticated
  useEffect(() => {
    if (!isAuthenticated && dataFetchAttempted) {
      // If not authenticated but we've tried to fetch data, use mock data
      setCategories(MOCK_CATEGORIES);
      setTodos(MOCK_TODOS);
      setUsesMockData(true);
      setLoading(false);
      return;
    }
    
    if (!isAuthenticated) {
      setCategories([]);
      setTodos([]);
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        setDataFetchAttempted(true);
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('order', { ascending: true });

        if (error) {
          throw error;
        }

        setCategories(data || []);

        // If no categories exist, create a default one
        if (data.length === 0) {
          try {
            const { data: newCategory, error: createError } = await supabase
              .from('categories')
              .insert({ 
                name: 'Default', 
                user_id: user.id, 
                order: 0,
                color: '#3B82F6' // blue-500
              })
              .select();

            if (createError) {
              throw createError;
            }

            if (newCategory) {
              setCategories(newCategory);
            }
          } catch (createError) {
            console.error('Error creating default category:', createError);
            // If we can't create a category, fall back to mock data
            setCategories(MOCK_CATEGORIES);
            setTodos(MOCK_TODOS);
            setUsesMockData(true);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Fall back to mock data if Supabase fails
        setCategories(MOCK_CATEGORIES);
        setTodos(MOCK_TODOS);
        setUsesMockData(true);
      }
    };

    fetchCategories();
  }, [isAuthenticated, user, dataFetchAttempted]);

  // Fetch todos when user is authenticated and categories are loaded
  useEffect(() => {
    if (usesMockData || !isAuthenticated || categories.length === 0) {
      setLoading(false);
      return;
    }

    const fetchTodos = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', user.id)
          .order('order', { ascending: true });

        if (error) {
          throw error;
        }

        setTodos(data || []);
      } catch (error) {
        console.error('Error fetching todos:', error);
        // If we have real categories but can't fetch todos, use mock todos for those categories
        if (!usesMockData) {
          const mockedTodos = categories.map((cat, index) => ({
            id: `temp-todo-${index}`,
            title: `Sample task for ${cat.name}`,
            completed: false,
            category_id: cat.id,
            order: 0
          }));
          setTodos(mockedTodos);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, [isAuthenticated, user, categories, usesMockData]);

  // Subscribe to changes in todos and categories
  useEffect(() => {
    if (!isAuthenticated) return;

    // Subscribe to todos changes
    const todosSubscription = supabase
      .channel('todos-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'todos',
          filter: `user_id=eq.${user?.id}` 
        }, 
        () => {
          fetchTodos();
        }
      )
      .subscribe();

    // Subscribe to categories changes
    const categoriesSubscription = supabase
      .channel('categories-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'categories',
          filter: `user_id=eq.${user?.id}` 
        }, 
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    // Fetch todos function
    const fetchTodos = async () => {
      const { data } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true });
      
      setTodos(data || []);
    };

    // Fetch categories function
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('order', { ascending: true });
      
      setCategories(data || []);
    };

    return () => {
      todosSubscription.unsubscribe();
      categoriesSubscription.unsubscribe();
    };
  }, [isAuthenticated, user]);

  // Add a new todo
  const addTodo = async (todo) => {
    try {
      const category = categories[0]; // Default to first category if none specified
      const categoryId = todo.category_id || (category ? category.id : null);
      
      // Get the highest order in the category
      const { data: highestOrderTodo } = await supabase
        .from('todos')
        .select('order')
        .eq('category_id', categoryId)
        .order('order', { ascending: false })
        .limit(1);
      
      const order = highestOrderTodo?.length > 0 ? highestOrderTodo[0].order + 1 : 0;
      
      const { data, error } = await supabase
        .from('todos')
        .insert({
          ...todo,
          category_id: categoryId,
          user_id: user.id,
          order
        })
        .select();

      if (error) {
        throw error;
      }
      
      return data[0];
    } catch (error) {
      console.error('Error adding todo:', error);
      return null;
    }
  };

  // Update a todo
  const updateTodo = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .match({ id })
        .select();

      if (error) {
        throw error;
      }
      
      setTodos(todos.map(todo => todo.id === id ? data[0] : todo));
      return data[0];
    } catch (error) {
      console.error('Error updating todo:', error);
      return null;
    }
  };

  // Delete a todo
  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .match({ id });

      if (error) {
        throw error;
      }
      
      setTodos(todos.filter(todo => todo.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting todo:', error);
      return false;
    }
  };

  // Add a new category
  const addCategory = async (category) => {
    try {
      // Get the highest order
      const { data: highestOrderCategory } = await supabase
        .from('categories')
        .select('order')
        .eq('user_id', user.id)
        .order('order', { ascending: false })
        .limit(1);
      
      const order = highestOrderCategory?.length > 0 ? highestOrderCategory[0].order + 1 : 0;
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          ...category,
          user_id: user.id,
          order
        })
        .select();

      if (error) {
        throw error;
      }
      
      setCategories([...categories, data[0]]);
      return data[0];
    } catch (error) {
      console.error('Error adding category:', error);
      return null;
    }
  };

  // Update a category
  const updateCategory = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .match({ id })
        .select();

      if (error) {
        throw error;
      }
      
      setCategories(categories.map(category => category.id === id ? data[0] : category));
      return data[0];
    } catch (error) {
      console.error('Error updating category:', error);
      return null;
    }
  };

  // Delete a category and its todos
  const deleteCategory = async (id) => {
    try {
      // First delete all todos in this category
      const { error: todosError } = await supabase
        .from('todos')
        .delete()
        .match({ category_id: id });

      if (todosError) {
        throw todosError;
      }

      // Then delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .match({ id });

      if (error) {
        throw error;
      }
      
      setTodos(todos.filter(todo => todo.category_id !== id));
      setCategories(categories.filter(category => category.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  };

  // Reorder todos when dragging
  const reorderTodos = async (todoId, newCategoryId, newOrder) => {
    try {
      // Get the current todo
      const todoToUpdate = todos.find(todo => todo.id === todoId);
      if (!todoToUpdate) return false;
      
      const oldCategoryId = todoToUpdate.category_id;
      const oldOrder = todoToUpdate.order;
      
      // Update the todo with new category and order
      const { error } = await supabase
        .from('todos')
        .update({
          category_id: newCategoryId,
          order: newOrder
        })
        .eq('id', todoId);

      if (error) {
        throw error;
      }

      // If moved to a different category, update orders in both categories
      if (oldCategoryId !== newCategoryId) {
        // Decrease order of todos in old category with higher order
        await supabase.rpc('update_todos_order_after_move', {
          p_old_category_id: oldCategoryId,
          p_old_order: oldOrder
        });
        
        // Increase order of todos in new category with same or higher order
        await supabase.rpc('update_todos_order_before_insert', {
          p_new_category_id: newCategoryId,
          p_new_order: newOrder
        });
      } 
      // If within same category
      else {
        // Moving up (to a lower index)
        if (newOrder < oldOrder) {
          await supabase.rpc('update_todos_order_move_up', {
            p_category_id: newCategoryId,
            p_old_order: oldOrder,
            p_new_order: newOrder
          });
        } 
        // Moving down (to a higher index)
        else if (newOrder > oldOrder) {
          await supabase.rpc('update_todos_order_move_down', {
            p_category_id: newCategoryId,
            p_old_order: oldOrder,
            p_new_order: newOrder
          });
        }
      }

      // This will be handled by the subscription, but we update the local state for immediate feedback
      const updatedTodos = todos.map(todo => {
        if (todo.id === todoId) {
          return { ...todo, category_id: newCategoryId, order: newOrder };
        }
        return todo;
      });
      
      setTodos(updatedTodos);
      return true;
    } catch (error) {
      console.error('Error reordering todos:', error);
      return false;
    }
  };

  // Reorder categories when dragging
  const reorderCategories = async (categoryId, newOrder) => {
    try {
      // Get the current category
      const categoryToUpdate = categories.find(category => category.id === categoryId);
      if (!categoryToUpdate) return false;
      
      const oldOrder = categoryToUpdate.order;
      
      // Update the category with new order
      const { error } = await supabase
        .from('categories')
        .update({
          order: newOrder
        })
        .eq('id', categoryId);

      if (error) {
        throw error;
      }

      // Moving up (to a lower index)
      if (newOrder < oldOrder) {
        await supabase.rpc('update_categories_order_move_up', {
          p_user_id: user.id,
          p_old_order: oldOrder,
          p_new_order: newOrder
        });
      } 
      // Moving down (to a higher index)
      else if (newOrder > oldOrder) {
        await supabase.rpc('update_categories_order_move_down', {
          p_user_id: user.id,
          p_old_order: oldOrder,
          p_new_order: newOrder
        });
      }

      // This will be handled by the subscription, but we update the local state for immediate feedback
      const updatedCategories = categories.map(category => {
        if (category.id === categoryId) {
          return { ...category, order: newOrder };
        }
        return category;
      });
      
      setCategories(updatedCategories);
      return true;
    } catch (error) {
      console.error('Error reordering categories:', error);
      return false;
    }
  };

  // Get todos by category (helper function)
  const getTodosByCategory = (categoryId) => {
    return todos.filter(todo => todo.category_id === categoryId);
  };

  // Get todos with no category (default todos)
  const defaultTodos = todos.filter(todo => todo.category_id === null);

  // Mock implementations for actions when using mock data
  const addMockTodo = (todo) => {
    const newTodo = {
      id: `mock-todo-${Date.now()}`,
      ...todo,
      user_id: 'mock-user'
    };
    setTodos([...todos, newTodo]);
    return newTodo;
  };

  const addMockCategory = (category) => {
    const newCategory = {
      id: `mock-cat-${Date.now()}`,
      ...category,
      user_id: 'mock-user',
      order: categories.length
    };
    setCategories([...categories, newCategory]);
    return newCategory;
  };

  // Provide functions based on whether we're using mock data or real data
  const contextValue = {
    categories,
    todos,
    defaultTodos,
    loading,
    getTodosByCategory,
    usesMockData,
    addTodo: usesMockData ? addMockTodo : addTodo,
    updateTodo: usesMockData ? 
      (id, updates) => {
        setTodos(todos.map(todo => todo.id === id ? {...todo, ...updates} : todo));
        return {...todos.find(todo => todo.id === id), ...updates};
      } : updateTodo,
    deleteTodo: usesMockData ?
      (id) => {
        setTodos(todos.filter(todo => todo.id !== id));
        return true;
      } : deleteTodo,
    addCategory: usesMockData ? addMockCategory : addCategory,
    updateCategory: usesMockData ?
      (id, updates) => {
        setCategories(categories.map(cat => cat.id === id ? {...cat, ...updates} : cat));
        return {...categories.find(cat => cat.id === id), ...updates};
      } : updateCategory,
    deleteCategory: usesMockData ?
      (id) => {
        setCategories(categories.filter(cat => cat.id !== id));
        setTodos(todos.filter(todo => todo.category_id !== id));
        return true;
      } : deleteCategory,
    reorderTodos: usesMockData ?
      (todoId, newCategoryId, newOrder) => {
        const todoToUpdate = todos.find(todo => todo.id === todoId);
        if (todoToUpdate) {
          const updatedTodo = {...todoToUpdate, category_id: newCategoryId, order: newOrder};
          setTodos(todos.map(todo => todo.id === todoId ? updatedTodo : todo));
        }
        return true;
      } : reorderTodos,
    reorderCategories: usesMockData ?
      (categoryId, newOrder) => {
        const catToUpdate = categories.find(cat => cat.id === categoryId);
        if (catToUpdate) {
          const updatedCat = {...catToUpdate, order: newOrder};
          setCategories(categories.map(cat => cat.id === categoryId ? updatedCat : cat));
        }
        return true;
      } : reorderCategories,
  };

  return (
    <TodoContext.Provider value={contextValue}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodo() {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
}