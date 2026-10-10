import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-border-default rounded-lg border-dashed">
      {icon && (
        <div className="mb-4 text-text-placeholder">
          {icon}
        </div>
      )}
      <h3 className="h3 text-text-primary mb-2">{title}</h3>
      <p className="text-body text-text-secondary max-w-sm mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
