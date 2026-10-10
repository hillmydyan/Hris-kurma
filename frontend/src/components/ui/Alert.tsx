import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  action?: React.ReactNode;
}

const icons = {
  info: <Info className="w-5 h-5 text-info-fg" />,
  success: <CheckCircle2 className="w-5 h-5 text-success-fg" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-fg" />,
  danger: <AlertCircle className="w-5 h-5 text-danger-fg" />
};

export function Alert({ variant = 'info', title, children, onClose, action }: AlertProps) {
  const styles = {
    info: 'bg-info-bg border-info-fg/20 text-info-fg',
    success: 'bg-success-bg border-success-fg/20 text-success-fg',
    warning: 'bg-warning-bg border-warning-fg/20 text-warning-fg',
    danger: 'bg-danger-bg border-danger-fg/20 text-danger-fg',
  };

  return (
    <div className={`flex items-start p-4 rounded-md border ${styles[variant]} shadow-xs`}>
      <div className="flex-shrink-0 mr-3">{icons[variant]}</div>
      
      <div className="flex-1 text-body">
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="opacity-90">{children}</div>
        
        {action && (
          <div className="mt-3">
            {action}
          </div>
        )}
      </div>

      {onClose && (
        <button 
          onClick={onClose}
          className="ml-3 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-sm"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
