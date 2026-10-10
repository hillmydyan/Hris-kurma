import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', disabled, ...props }, ref) => {
    return (
      <div className={`flex flex-col space-y-1.5 ${className}`}>
        <label className="text-label text-text-primary">
          {label} {props.required && <span className="text-danger">*</span>}
        </label>
        
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-text-placeholder">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            disabled={disabled}
            className={`w-full h-10 px-3 rounded-sm border bg-surface text-text-primary placeholder:text-text-placeholder 
              focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors
              disabled:opacity-50 disabled:bg-subtle
              ${leftIcon ? 'pl-9' : ''} 
              ${rightIcon ? 'pr-9' : ''}
              ${error 
                ? 'border-danger focus:ring-danger focus:border-danger' 
                : 'border-border-input focus:ring-primary-ring focus:border-primary-ring'
              }
              md:text-body text-body-lg
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-text-placeholder">
              {rightIcon}
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p className={`text-caption ${error ? 'text-danger' : 'text-text-muted'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
