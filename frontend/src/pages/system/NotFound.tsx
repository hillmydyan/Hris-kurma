import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { FileQuestion } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-subtle text-text-muted mx-auto rounded-full flex items-center justify-center">
          <FileQuestion className="w-10 h-10" />
        </div>
        
        <div>
          <h1 className="text-display text-text-primary mb-2">404</h1>
          <h2 className="h2 text-text-primary">Halaman Tidak Ditemukan</h2>
          <p className="text-body text-text-secondary mt-2">
            Maaf, halaman yang Anda cari telah dipindahkan atau tidak pernah ada.
          </p>
        </div>

        <Link to="/" className="inline-block mt-4">
          <Button variant="primary">Kembali ke Beranda</Button>
        </Link>
      </div>
    </div>
  );
}
