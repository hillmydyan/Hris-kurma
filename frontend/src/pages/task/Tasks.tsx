import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { CheckSquare, Plus, Check, Clock } from 'lucide-react';
import api from '../../lib/api';

export function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await api.post('/tasks', { title: newTaskTitle });
      setNewTaskTitle('');
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTaskStatus = async (id: number, status: string) => {
    try {
      await api.put(`/tasks/${id}`, { status });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="h1 text-text-primary">Tugas Harian</h1>
        <p className="text-body text-text-secondary">Kelola daftar pekerjaan dan tingkatkan produktivitas Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              <form onSubmit={handleAddTask} className="flex gap-2">
                <div className="flex-1">
                  <Input 
                    label="" 
                    placeholder="Tambah tugas baru..." 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                </div>
                <Button variant="primary" type="submit" leftIcon={<Plus className="w-4 h-4" />}>
                  Tambah
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Tugas</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-text-secondary">Memuat tugas...</div>
              ) : tasks.length === 0 ? (
                <div className="p-8 text-center text-text-secondary flex flex-col items-center">
                  <CheckSquare className="w-12 h-12 text-text-muted mb-2" />
                  Belum ada tugas. Yeay!
                </div>
              ) : (
                <ul className="divide-y divide-border-default">
                  {tasks.map((task) => (
                    <li key={task.id} className="p-4 flex items-center justify-between hover:bg-subtle transition-colors">
                      <div className="flex items-center gap-3">
                        <button 
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-success border-success text-surface' : 'border-border-input hover:border-primary'}`}
                          onClick={() => updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                        >
                          {task.status === 'done' && <Check className="w-4 h-4" />}
                        </button>
                        <span className={`text-body ${task.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                          {task.title}
                        </span>
                      </div>
                      <Badge variant={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'info' : 'secondary'}>
                        {task.status === 'done' ? 'Selesai' : task.status === 'in_progress' ? 'Proses' : 'Belum Mulai'}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-primary-soft border-primary/20">
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-body text-text-secondary">Total Tugas</span>
                <span className="text-label text-text-primary">{tasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body text-text-secondary">Selesai</span>
                <span className="text-label text-success-fg font-bold">
                  {tasks.filter(t => t.status === 'done').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body text-text-secondary">Belum Selesai</span>
                <span className="text-label text-warning-fg font-bold">
                  {tasks.filter(t => t.status !== 'done').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
