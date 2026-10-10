import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Briefcase, UserPlus, Users, Search } from 'lucide-react';
import api from '../../lib/api';

export function Recruitment() {
  const [openings, setOpenings] = useState<any[]>([]);

  useEffect(() => {
    api.get('/job-openings').then(res => setOpenings(res.data));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="h1 text-text-primary">Rekrutmen</h1>
          <p className="text-body text-text-secondary">Kelola lowongan pekerjaan, kandidat, dan proses onboarding.</p>
        </div>
        <div className="flex gap-2">
          <Button leftIcon={<UserPlus className="w-4 h-4" />}>Tambah Lowongan</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center space-x-4 border-l-4 border-primary">
          <div className="p-3 bg-primary-soft text-primary rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Lowongan Aktif</p>
            <p className="text-xl font-bold">3</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4 border-l-4 border-warning">
          <div className="p-3 bg-warning-soft text-warning rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Kandidat</p>
            <p className="text-xl font-bold">24</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center space-x-4 border-l-4 border-success">
          <div className="p-3 bg-success-soft text-success rounded-lg">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Onboarding</p>
            <p className="text-xl font-bold">2</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-5 border-b border-border-default flex justify-between items-center">
          <h2 className="text-lg font-bold text-text-primary">Lowongan Terbuka</h2>
          <div className="relative">
            <input 
                type="text" 
                placeholder="Cari..." 
                className="pl-9 pr-4 py-2 bg-subtle border-none rounded-md text-sm focus:ring-1 focus:ring-primary outline-none"
            />
            <Search className="w-4 h-4 text-text-secondary absolute left-3 top-2.5" />
          </div>
        </div>
        <div className="divide-y divide-border-default">
          {openings.map((job, idx) => (
            <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-text-primary text-lg">{job.description}</h3>
                <div className="flex items-center text-sm text-text-secondary mt-1 space-x-3">
                  <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1" /> Department #{job.department_id}</span>
                  <span>•</span>
                  <span>Kebutuhan: {job.headcount} Orang</span>
                  <span>•</span>
                  <span className="text-primary font-medium">{Math.floor(Math.random() * 15) + 1} Kandidat</span>
                </div>
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" size="sm">Lihat Kandidat</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
