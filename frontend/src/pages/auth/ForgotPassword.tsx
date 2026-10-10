import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';

export function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulasi request reset
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1000);
  };

  return (
    <Card className="animate-in slide-in-from-bottom-4 duration-500">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="h2 text-text-primary">Lupa Password</h2>
          <p className="text-text-secondary text-body mt-1">Kami akan mengirimkan instruksi untuk mereset password ke email Anda.</p>
        </div>

        {isSuccess ? (
          <div className="space-y-6">
            <Alert variant="success" title="Email Terkirim">
              Silakan periksa kotak masuk Anda (termasuk folder spam) untuk melanjutkan proses reset password.
            </Alert>
            <Link to="/login" className="flex items-center justify-center h-10 px-4 bg-primary text-surface rounded-sm hover:bg-primary-hover text-label transition-colors">
              Kembali ke Halaman Masuk
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              label="Email Terdaftar" 
              type="email" 
              placeholder="nama@kurmagroup.id" 
              required 
              leftIcon={<Mail className="w-5 h-5" />}
            />

            <div className="flex flex-col gap-3">
              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Kirim Instruksi
              </Button>
              <Link to="/login" className="flex items-center justify-center h-10 px-4 rounded-sm border border-border-input hover:bg-subtle text-text-primary text-label transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
