import { useEffect, useState } from 'react';
import { getTrackers } from '../api';
import type { Tracker } from '../api';
import { TrackerCard } from '../components/TrackerCard';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Settings } from 'lucide-react';

export const Dashboard = () => {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchTrackers();
    const interval = setInterval(fetchTrackers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <header className="flex justify-between items-center mb-8 pb-4 border-b border-border">
        <h1 className="text-3xl font-bold tracking-tight">Tracker Status</h1>
        <Link to="/admin">
            <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" /> Admin
            </Button>
        </Link>
      </header>
      
      {loading && trackers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Loading status...</div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {trackers.map((tracker) => (
            <TrackerCard key={tracker.id} tracker={tracker} />
          ))}
          {trackers.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">No trackers active.</p>
          )}
        </div>
      )}
    </div>
  );
};
