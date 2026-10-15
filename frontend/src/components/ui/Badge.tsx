import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'sky' | 'orange' | 'neutral' | 'primary' | 'secondary';
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'neutral', icon, dot, className = '' }: BadgeProps) {
  const variants: Record<string, string> = {
    success: 'bg-success-bg text-success-fg',
    warning: 'bg-warning-bg text-warning-fg',
    danger: 'bg-danger-bg text-danger-fg',
    info: 'bg-info-bg text-info-fg',
    violet: 'bg-violet-bg text-violet-fg',
    sky: 'bg-sky-bg text-sky-fg',
    orange: 'bg-orange-bg text-orange-fg',
    neutral: 'bg-neutral-bg text-neutral-fg',
    primary: 'bg-primary-soft text-primary',
    secondary: 'bg-neutral-bg text-neutral-fg',
  };

  const variantClass = variants[variant] || variants.neutral;

  return (
    <span className={`inline-flex items-center px-2 h-6 rounded-full text-caption font-medium ${variantClass} ${className}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />}
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </span>
  );
}
