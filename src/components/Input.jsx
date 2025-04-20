import React, { forwardRef } from 'react';
import classNames from 'classnames';

const Input = forwardRef(({ 
  className = '', 
  type = 'text', 
  label, 
  error, 
  id,
  fullWidth = true,
  ...props 
}, ref) => {
  const inputClasses = classNames(
    'input px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
    {
      'border-red-300 dark:border-red-500': error,
      'border-input': !error,
      'w-full': fullWidth
    },
    className
  );

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={type}
          className={inputClasses}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 