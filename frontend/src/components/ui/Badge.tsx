import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'sky' | 'orange' | 'neutral';
  icon?: React.ReactNode;
  dot?: boolean;
}

export function Badge({ children, variant = 'neutral', icon, dot }: BadgeProps) {
  const variants = {
    success: 'bg-success-bg text-success-fg',
    warning: 'bg-warning-bg text-warning-fg',
    danger: 'bg-danger-bg text-danger-fg',
    info: 'bg-info-bg text-info-fg',
    violet: 'bg-violet-bg text-violet-fg',
    sky: 'bg-sky-bg text-sky-fg',
    orange: 'bg-orange-bg text-orange-fg',
    neutral: 'bg-neutral-bg text-neutral-fg',
  };

  return (
    <span className={`inline-flex items-center px-2 h-6 rounded-full text-caption font-medium ${variants[variant]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />}
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </span>
  );
}
