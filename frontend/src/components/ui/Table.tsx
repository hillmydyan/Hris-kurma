import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto bg-surface border border-border-default rounded-lg shadow-xs ${className}`}>
      <table className="w-full text-left text-body whitespace-nowrap">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-subtle border-b border-border-default text-text-secondary text-label">
      {children}
    </thead>
  );
}

export function TableRow({ children, className = '', onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  return (
    <tr 
      className={`border-b border-border-default last:border-0 hover:bg-subtle transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }: { children?: React.ReactNode, className?: string }) {
  return (
    <th className={`px-5 py-3 font-medium ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <td className={`px-5 py-4 ${className}`}>
      {children}
    </td>
  );
}
