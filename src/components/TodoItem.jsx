import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import classNames from 'classnames';
import { useTodo } from '../contexts/TodoContext';
import TodoInput from './ui/TodoInput';

const TodoItem = ({ todo }) => {
  const { updateTodo, deleteTodo } = useTodo();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  // Setup drag and drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    data: {
      type: 'todo',
      todo,
    },
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    // Update editTitle if todo title changes externally
    setEditTitle(todo.title);
  }, [todo.title]);

  const handleToggleComplete = async (e) => {
    e.stopPropagation();
    await updateTodo(todo.id, { completed: !todo.completed });
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    await deleteTodo(todo.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e?.stopPropagation();
    if (editTitle.trim() !== '') {
      await updateTodo(todo.id, { title: editTitle.trim() });
      setIsEditing(false);
    }
  };

  const handleCancel = (e) => {
    e?.stopPropagation();
    setEditTitle(todo.title);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={classNames(
        'todo-item',
        {
          'dragging': isDragging,
          'completed': todo.completed,
        }
      )}
    >
      <div
        {...listeners}
        className="todo-drag-handle"
        aria-label="Drag to reorder"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
        </svg>
      </div>

      <div className="todo-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggleComplete}
          className="todo-checkbox"
          id={`todo-${todo.id}`}
        />
        <label 
          htmlFor={`todo-${todo.id}`} 
          className="todo-checkbox-label"
          aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {todo.completed && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </label>
      </div>

      <div className="todo-content" onClick={isEditing ? null : handleEdit}>
        {isEditing ? (
          <TodoInput
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onSave={handleSave}
            onCancel={handleCancel}
            placeholder="Enter task..."
          />
        ) : (
          <span
            className={classNames('todo-text', {
              'completed': todo.completed,
            })}
          >
            {todo.title}
          </span>
        )}
      </div>

      <div className="todo-actions" onClick={(e) => e.stopPropagation()}>
        {!isEditing ? (
          <>
            <button
              onClick={handleEdit}
              className="action-button edit"
              aria-label="Edit todo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="action-button delete"
              aria-label="Delete todo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              className="action-button save"
              aria-label="Save todo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
            <button
              onClick={handleCancel}
              className="action-button cancel"
              aria-label="Cancel editing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(TodoItem);