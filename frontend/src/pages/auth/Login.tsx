import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      const cleanEmail = email.trim().toLowerCase();
      const response = await api.post('/login', { email: cleanEmail, password });
      
      if (response.data.access_token && response.data.user) {
        login(response.data.access_token, response.data.user);
        navigate('/', { replace: true });
      } else {
        setError('Respons server tidak valid.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.email?.[0] || 
        'Gagal login. Periksa kembali email dan password Anda.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <Card className="animate-in slide-in-from-bottom-4 duration-500 shadow-xl border-slate-200">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Masuk ke HRIS</h2>
          <p className="text-slate-500 text-xs mt-1">Sistem Informasi SDM & Presensi Kurma Group.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 rounded-lg flex items-center text-xs border border-rose-200">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Email" 
            type="email" 
            placeholder="nama@kurma.group" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />
          
          <div className="space-y-1">
            <Input 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-[11px] text-emerald-600 hover:underline font-medium p-1 -mr-1">
                Lupa Password?
              </Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700" isLoading={isLoading}>
            Masuk
          </Button>
        </form>

        {/* Demo Accounts Quick-Fill Pill Buttons (Hanya muncul saat tahap development/lokal) */}
        {import.meta.env.DEV && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Pilih Cepat Akun Demo (Development Mode)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('ahmad.mkt@kurma.group')}
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-left transition-colors flex items-center"
              >
                <User className="w-3.5 h-3.5 mr-1.5 shrink-0 text-emerald-600" />
                <div className="truncate">
                  <span className="font-semibold block truncate">Staff Marketing</span>
                  <span className="text-[10px] text-emerald-600 truncate block">Portal Karyawan</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@kurma.group')}
                className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-left transition-colors flex items-center"
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 shrink-0 text-indigo-600" />
                <div className="truncate">
                  <span className="font-semibold block truncate">Super Admin</span>
                  <span className="text-[10px] text-indigo-600 truncate block">Dual-Portal Access</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('mgr.herbal@kurma.group')}
                className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-left transition-colors flex items-center"
              >
                <User className="w-3.5 h-3.5 mr-1.5 shrink-0 text-amber-600" />
                <div className="truncate">
                  <span className="font-semibold block truncate">Manager Herbal</span>
                  <span className="text-[10px] text-amber-600 truncate block">Review Team</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('siti.copy@kurma.group')}
                className="p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-left transition-colors flex items-center"
              >
                <User className="w-3.5 h-3.5 mr-1.5 shrink-0 text-teal-600" />
                <div className="truncate">
                  <span className="font-semibold block truncate">Staff Fashion</span>
                  <span className="text-[10px] text-teal-600 truncate block">Portal Karyawan</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
