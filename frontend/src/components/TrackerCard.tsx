import { useState } from 'react';
import type { Tracker } from '../api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Play, Clock, CheckCircle, XCircle, AlertCircle, Loader2, FileText, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface TrackerCardProps {
  tracker: Tracker;
  onRun?: (id: number) => void;
  onEdit?: (tracker: Tracker) => void;
  isAdmin?: boolean;
}

export const TrackerCard = ({ tracker, onRun, onEdit, isAdmin }: TrackerCardProps) => {
  const [showLogs, setShowLogs] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const status = tracker.last_run_status || 'pending';

  const StatusIcon = () => {
    switch (status) {
        case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'failure': return <XCircle className="h-5 w-5 text-red-500" />;
        case 'running': return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
        default: return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <>
      <Card className="flex flex-col h-full hover:shadow-md transition-shadow relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium truncate pr-4" title={tracker.name}>
            {tracker.name}
          </CardTitle>
          <StatusIcon />
        </CardHeader>
        
        <CardContent className="flex-grow pt-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {tracker.description || "No description provided."}
          </p>
          
          {tracker.last_run_at && (
            <div className="flex items-center mt-4 text-xs text-muted-foreground">
              <Clock className="mr-1 h-3 w-3" />
              {new Date(tracker.last_run_at).toLocaleString()}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 flex gap-2">
            {tracker.last_run_info && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setShowInfo(true)}
                >
                    <AlertCircle className="mr-2 h-3 w-3" /> Info
                </Button>
            )}
            
            {isAdmin && tracker.last_run_logs && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setShowLogs(true)}
                >
                    <FileText className="mr-2 h-3 w-3" /> Logs
                </Button>
            )}
            
            {isAdmin && (
                <>
                    {onEdit && (
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => onEdit(tracker)}
                        >
                            Edit
                        </Button>
                    )}
                    {onRun && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => onRun(tracker.id)}
                            disabled={status === 'running'}
                        >
                        <Play className="mr-2 h-3 w-3" /> Run
                        </Button>
                    )}
                </>
            )}
        </CardFooter>
      </Card>

      {/* Info Modal */}
      {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
              <Card className="w-full max-w-md shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                      <CardTitle>Run Summary</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setShowInfo(false)}>
                          <X className="h-4 w-4" />
                      </Button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                      {tracker.last_run_info?.grep_matches?.length > 0 && (
                          <div>
                              <h4 className="text-sm font-semibold mb-2">Matches Found</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {tracker.last_run_info.grep_matches.map((m: any, i: number) => (
                                      <li key={i}>{m.text || m.regex}</li>
                                  ))}
                              </ul>
                          </div>
                      )}
                      
                      {Object.keys(tracker.last_run_info?.extracted_variables || {}).length > 0 && (
                          <div>
                              <h4 className="text-sm font-semibold mb-2">Extracted Data</h4>
                              <div className="grid gap-2">
                                  {Object.entries(tracker.last_run_info.extracted_variables).map(([k, v]: any) => (
                                      <div key={k} className="flex justify-between text-sm border-b pb-1 border-border/50 last:border-0">
                                          <span className="text-muted-foreground">{k}:</span>
                                          <span className="font-mono">{String(v)}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      {tracker.last_run_info?.network_requests_captured > 0 && (
                          <div className="text-sm">
                              <span className="font-semibold">Network Requests: </span>
                              {tracker.last_run_info.network_requests_captured}
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>
      )}

      {/* Log Modal Overlay */}
      {showLogs && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
              <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                  <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                      <CardTitle>Execution Logs: {tracker.name}</CardTitle>
                      <Button variant="ghost" size="icon" onClick={() => setShowLogs(false)}>
                          <X className="h-4 w-4" />
                      </Button>
                  </CardHeader>
                  <CardContent className="p-0 overflow-hidden flex-grow">
                      <div className="bg-black text-green-400 font-mono text-xs p-4 h-full overflow-auto whitespace-pre-wrap">
                          {tracker.last_run_logs || "No logs available."}
                      </div>
                  </CardContent>
              </Card>
          </div>
      )}
    </>
  );
};
