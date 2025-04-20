import React from 'react';
import classNames from 'classnames';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  type = 'button',
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = 'btn font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors rounded';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary/50',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover focus:ring-secondary/50',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800',
    ghost: 'bg-transparent text-foreground hover:bg-secondary/20 focus:ring-secondary/40',
  };
  
  const sizeClasses = {
    sm: 'py-1 px-2 text-sm',
    md: 'py-2 px-4',
    lg: 'py-3 px-6 text-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const buttonClasses = classNames(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    {
      'opacity-50 cursor-not-allowed': disabled,
    },
    className
  );
  
  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button; 