import React, { useState, useMemo } from 'react';
import { useTodo } from '../contexts/TodoContext';
import TodoItem from './TodoItem';
import Button from './Button';
import TodoInput from './ui/TodoInput';

const DefaultColumn = () => {
  const { defaultTodos, addTodo } = useTodo();
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  
  // Filter out duplicate tasks
  const uniqueDefaultTodos = useMemo(() => {
    const uniqueIds = new Set();
    return defaultTodos.filter(todo => {
      if (uniqueIds.has(todo.id)) {
        return false;
      }
      uniqueIds.add(todo.id);
      return true;
    });
  }, [defaultTodos]);

  const handleAddTodo = async (e) => {
    e?.preventDefault();
    if (newTodoTitle.trim() !== '') {
      await addTodo({
        title: newTodoTitle.trim(),
        completed: false,
        // Default category has null category_id
        category_id: null
      });
      setNewTodoTitle('');
      setIsAddingTodo(false);
    }
  };

  const handleCancelAdd = () => {
    setNewTodoTitle('');
    setIsAddingTodo(false);
  };

  return (
    <div className="default-column">
      <div className="default-column-header">
        <h3 className="default-column-title">
          <span className="color-dot blue-dot"></span>
          Default
        </h3>
      </div>

      <div className="default-column-content">
        {uniqueDefaultTodos.length === 0 && !isAddingTodo ? (
          <div className="empty-state">
            <p className="empty-state-text">No tasks yet</p>
          </div>
        ) : (
          uniqueDefaultTodos.map(todo => (
            <TodoItem key={todo.id} todo={todo} />
          ))
        )}
        
        {isAddingTodo ? (
          <div className="todo-item">
            <div className="todo-content">
              <TodoInput
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                onSave={handleAddTodo}
                onCancel={handleCancelAdd}
                placeholder="Add a new task..."
              />
            </div>
            <div className="todo-actions">
              <button
                onClick={handleAddTodo}
                className="action-button save"
                aria-label="Save todo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
              <button
                onClick={handleCancelAdd}
                className="action-button cancel"
                aria-label="Cancel adding"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTodo(true)}
            className="add-todo-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Task
          </button>
        )}
      </div>
    </div>
  );
};

export default DefaultColumn;