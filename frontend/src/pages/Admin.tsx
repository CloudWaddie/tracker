import { useEffect, useState } from 'react';
import { getTrackers, createTracker, runTracker, updateTracker } from '../api';
import type { Tracker } from '../api';
import { TrackerCard } from '../components/TrackerCard';
import { TrackerFlowEditor } from '../TrackerFlowEditor';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';

export const Admin = () => {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null);
  const navigate = useNavigate();

  // Load key from storage
  const adminKey = localStorage.getItem('adminKey');

  useEffect(() => {
    if (!adminKey) {
        navigate('/login');
        return;
    }
    fetchTrackers();
  }, [adminKey, navigate]);

  const fetchTrackers = async () => {
    try {
      setLoading(true);
      const data = await getTrackers();
      setTrackers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTracker = async (trackerData: any) => {
    if (!adminKey) return;
    try {
      if (editingTracker) {
        await updateTracker(editingTracker.id, trackerData, adminKey);
      } else {
        await createTracker(trackerData, adminKey);
      }
      setView('list');
      setEditingTracker(null);
      fetchTrackers();
    } catch (e: any) {
        if (e.message.includes('Unauthorized')) navigate('/login');
        else alert(e.message);
    }
  };

  const handleRunTracker = async (id: number) => {
    if (!adminKey) return;
    try {
      await runTracker(id, adminKey);
      fetchTrackers();
    } catch (e: any) {
      if (e.message.includes('Unauthorized')) navigate('/login');
      else alert(e.message);
    }
  };

  const handleEditTracker = (tracker: Tracker) => {
      setEditingTracker(tracker);
      setView('create');
  };

  if (view === 'create') {
    return (
        <div className="fixed inset-0 z-50 bg-background">
             <TrackerFlowEditor 
                initialData={editingTracker}
                onSave={handleSaveTracker}
                onCancel={() => {
                    setView('list');
                    setEditingTracker(null);
                }}
            />
        </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-border">
        <div className="flex items-center gap-4">
            <Link to="/">
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        </div>
        <Button onClick={() => {
            setEditingTracker(null);
            setView('create');
        }}>
            <Plus className="mr-2 h-4 w-4" /> Create Tracker
        </Button>
      </header>
            
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {trackers.map((tracker) => (
                <TrackerCard 
                    key={tracker.id} 
                    tracker={tracker} 
                    isAdmin={true} 
                    onRun={handleRunTracker} 
                    onEdit={handleEditTracker}
                />
            ))}
            {trackers.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                    No trackers found. Create one to get started.
                </div>
            )}
      </div>
    </div>
  );
};
