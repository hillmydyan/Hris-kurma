import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Target, TrendingUp, Award } from 'lucide-react';
import api from '../../lib/api';

export function Kpi() {
  const [kpis, setKpis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKpis = async () => {
    setLoading(true);
    try {
      const response = await api.get('/kpis');
      setKpis(response.data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="h1 text-text-primary">KPI & Kinerja</h1>
        <p className="text-body text-text-secondary">Pantau performa dan pencapaian target bulanan Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary to-primary-hover text-surface shadow-md">
          <CardContent className="p-6 flex flex-col justify-center items-center h-full text-center">
            <Award className="w-12 h-12 mb-3 opacity-90" />
            <h3 className="text-surface/80 text-label mb-1">Skor Rata-Rata Tahun Ini</h3>
            <p className="text-[48px] font-bold leading-none tracking-tight">85<span className="text-xl font-normal text-surface/70">/100</span></p>
            <Badge variant="success" className="mt-4 bg-surface/20 border-surface/30 text-surface">Sangat Baik</Badge>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Riwayat Penilaian (KPI)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="py-8 text-center text-text-secondary">Memuat data...</div>
            ) : kpis.length === 0 ? (
              <div className="py-8 text-center text-text-secondary">
                Belum ada data penilaian KPI.
              </div>
            ) : (
              kpis.map((kpi) => (
                <div key={kpi.id} className="p-4 border border-border-default rounded-lg bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold uppercase leading-none">{new Date(kpi.month + '-01').toLocaleString('id-ID', { month: 'short' })}</span>
                      <span className="text-xs leading-none mt-0.5">{kpi.month.split('-')[0]}</span>
                    </div>
                    <div>
                      <h4 className="text-label text-text-primary">Periode {kpi.month}</h4>
                      <p className="text-caption text-text-secondary mt-1">{kpi.feedback || 'Tidak ada catatan khusus.'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <div className="flex items-baseline gap-1">
                      <span className="text-display text-text-primary">{kpi.score}</span>
                      <span className="text-caption text-text-muted">/ 100</span>
                    </div>
                    <Badge variant={kpi.score >= 85 ? 'success' : kpi.score >= 70 ? 'info' : 'warning'}>
                      {kpi.score >= 85 ? 'Sangat Baik' : kpi.score >= 70 ? 'Cukup' : 'Perlu Peningkatan'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
