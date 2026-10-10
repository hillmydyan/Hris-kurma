import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
  danger?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', footer, danger = false }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-[400px]',
    md: 'max-w-[560px]',
    lg: 'max-w-[720px]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:items-center sm:p-0 p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-text-primary/40 transition-opacity animate-in fade-in" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div 
        className={`bg-surface w-full rounded-t-xl sm:rounded-lg shadow-lg z-50 animate-in zoom-in-95 duration-200 mt-auto sm:mt-0 ${sizeClasses[size]}`}
        role="dialog" 
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
          <h3 className={`h3 ${danger ? 'text-danger' : 'text-text-primary'}`}>
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-ring rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-6 py-4 text-body max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 border-t border-border-default bg-page rounded-b-lg flex flex-col sm:flex-row justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Komponen Helper untuk Footer Konfirmasi Default
export function ConfirmFooter({ 
  onCancel, 
  onConfirm, 
  confirmText = 'Simpan', 
  cancelText = 'Batal', 
  danger = false,
  isLoading = false 
}: { 
  onCancel: () => void, 
  onConfirm: () => void, 
  confirmText?: string, 
  cancelText?: string, 
  danger?: boolean,
  isLoading?: boolean 
}) {
  return (
    <>
      <Button variant="secondary" onClick={onCancel} disabled={isLoading} className="w-full sm:w-auto">
        {cancelText}
      </Button>
      <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading} className="w-full sm:w-auto">
        {confirmText}
      </Button>
    </>
  );
}
