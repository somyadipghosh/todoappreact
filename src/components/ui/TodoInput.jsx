import React, { useRef, useEffect } from 'react';

const TodoInput = ({ 
  value, 
  onChange, 
  onSave, 
  onCancel, 
  autoFocus = true,
  placeholder = "Enter a task..." 
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave && onSave(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel && onCancel(e);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      // Removed onBlur to prevent automatic saves
      className="todo-edit-input"
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

export default TodoInput;