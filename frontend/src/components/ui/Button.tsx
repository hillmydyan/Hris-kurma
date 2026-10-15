import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
  asChild?: boolean;
}

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  icon,
  asChild,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-sm text-label font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-surface hover:bg-primary-hover',
    secondary: 'bg-surface text-text-primary border border-border-input hover:bg-subtle',
    outline: 'bg-transparent text-text-primary border border-border-input hover:bg-subtle',
    text: 'bg-transparent text-primary hover:bg-subtle',
    danger: 'bg-danger text-surface hover:bg-danger-hover focus:ring-danger',
  };

  const sizes = {
    sm: 'h-8 px-3 text-caption',
    md: 'h-10 px-4',
    lg: 'h-12 px-6 text-body-lg',
  };

  const actualLeftIcon = leftIcon || icon;

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : actualLeftIcon ? (
        <span className="mr-2">{actualLeftIcon}</span>
      ) : null}
      
      {children}
      
      {!isLoading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
}
