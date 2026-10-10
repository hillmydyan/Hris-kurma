import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

export function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/login', { email, password });
      if (response.data.access_token) {
        localStorage.setItem('auth_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal login. Periksa kembali email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="animate-in slide-in-from-bottom-4 duration-500">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="h2 text-text-primary">Masuk</h2>
          <p className="text-text-secondary text-body mt-1">Masukkan email dan password Anda.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md flex items-center text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Email" 
            type="email" 
            placeholder="nama@kurmagroup.id" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-5 h-5" />}
          />
          
          <div className="space-y-1">
            <Input 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="hover:text-text-primary focus:outline-none focus:text-primary">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-caption text-primary hover:text-primary-hover font-medium p-1 -mr-1">
                Lupa Password?
              </Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
            Masuk
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
