import React, { useState, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTodo } from '../contexts/TodoContext';
import TodoItem from './TodoItem';
import Button from './Button';
import classNames from 'classnames';

const CategoryCard = ({ category }) => {
  const { 
    updateCategory, 
    deleteCategory, 
    addTodo, 
    getTodosByCategory 
  } = useTodo();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  
  // Get todos and ensure no duplicates using a Set to track unique IDs
  const todos = useMemo(() => {
    const categoryTodos = getTodosByCategory(category.id);
    const uniqueIds = new Set();
    return categoryTodos.filter(todo => {
      if (uniqueIds.has(todo.id)) {
        return false;
      }
      uniqueIds.add(todo.id);
      return true;
    });
  }, [category.id, getTodosByCategory]);
  
  const todoIds = todos.map(todo => todo.id);

  // Setup drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    data: {
      type: 'category',
      category,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    "--color": category.color,
  };

  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
  ];

  const handleSaveCategory = async () => {
    if (editName.trim() !== '') {
      await updateCategory(category.id, { name: editName.trim() });
      setIsEditing(false);
    }
  };

  const handleColorChange = async (color) => {
    await updateCategory(category.id, { color });
    setColorPickerOpen(false);
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (newTodoTitle.trim() !== '') {
      await addTodo({
        title: newTodoTitle.trim(),
        completed: false,
        category_id: category.id
      });
      setNewTodoTitle('');
      setIsAddingTodo(false);
    }
  };

  const handleKeyDown = (e, type) => {
    if (e.key === 'Enter') {
      if (type === 'category') {
        handleSaveCategory();
      } else if (type === 'todo') {
        handleAddTodo(e);
      }
    } else if (e.key === 'Escape') {
      if (type === 'category') {
        setEditName(category.name);
        setIsEditing(false);
      } else if (type === 'todo') {
        setNewTodoTitle('');
        setIsAddingTodo(false);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={classNames(
        'category-card',
        { 'dragging': isDragging }
      )}
    >
      {/* Card header */}
      <div className="category-header">
        <div className="category-header-title">
          <div 
            {...listeners} 
            className="category-drag-handle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
          </div>

          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveCategory}
              onKeyDown={(e) => handleKeyDown(e, 'category')}
              className="category-name-input"
              autoFocus
            />
          ) : (
            <div 
              className="category-title"
              onClick={() => setIsEditing(true)}
            >
              <div 
                className="color-dot"
                style={{ backgroundColor: category.color }}
              ></div>
              <span>{category.name}</span>
            </div>
          )}
        </div>

        <div className="category-actions">
          <button
            onClick={() => setColorPickerOpen(!colorPickerOpen)}
            className="action-button"
            aria-label="Change color"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="4"></circle>
            </svg>
          </button>
          
          <button
            onClick={() => setIsEditing(true)}
            className="action-button edit"
            aria-label="Edit category"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          
          <button
            onClick={() => deleteCategory(category.id)}
            className="action-button delete"
            aria-label="Delete category"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
          
          {colorPickerOpen && (
            <div className="color-picker">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className="color-option"
                  style={{ backgroundColor: color.value }}
                  aria-label={`Select ${color.name} color`}
                ></button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Todo list */}
      <div className="category-content">
        {todos.length === 0 ? (
          <div className="category-empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <p className="empty-text">No tasks yet</p>
            <button
              onClick={() => setIsAddingTodo(true)}
              className="add-first-task-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add your first task
            </button>
          </div>
        ) : (
          <SortableContext items={todoIds} strategy={verticalListSortingStrategy}>
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </SortableContext>
        )}
      </div>

      {/* Add todo form */}
      {isAddingTodo ? (
        <form onSubmit={handleAddTodo} className="add-task-form">
          <div className="form-input-wrapper">
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'todo')}
              onBlur={() => {
                if (newTodoTitle.trim() === '') {
                  setIsAddingTodo(false);
                }
              }}
              placeholder="What needs to be done?"
              className="task-input"
              autoFocus
            />
          </div>
          <div className="form-actions">
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              onClick={() => setIsAddingTodo(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              size="sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Add Task
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingTodo(true)}
          className="add-task-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" className="opacity-20"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          Add task
        </button>
      )}
    </div>
  );
};

export default CategoryCard;