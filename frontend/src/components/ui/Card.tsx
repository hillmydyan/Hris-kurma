interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
}

export function Card({ children, className = '', onClick }: CardProps) {
  const isClickable = !!onClick;
  
  return (
    <div 
      className={`bg-surface border border-border-default rounded-lg shadow-xs overflow-hidden
        ${isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} 
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`px-5 py-4 border-b border-border-default ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <h3 className={`h3 text-text-primary ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}
