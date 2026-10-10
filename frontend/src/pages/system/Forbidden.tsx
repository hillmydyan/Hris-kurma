import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export function Forbidden() {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-danger-bg text-danger mx-auto rounded-full flex items-center justify-center">
          <ShieldAlert className="w-10 h-10" />
        </div>
        
        <div>
          <h1 className="text-display text-text-primary mb-2">403</h1>
          <h2 className="h2 text-text-primary">Akses Ditolak</h2>
          <p className="text-body text-text-secondary mt-2">
            Anda tidak memiliki izin (permission) untuk mengakses halaman ini. Silakan hubungi Administrator jika Anda merasa ini adalah kesalahan.
          </p>
        </div>

        <Link to="/" className="inline-block mt-4">
          <Button variant="primary">Kembali ke Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
