import { Handle, Position } from 'reactflow';
import { Card, CardHeader, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { 
    Globe, Clock, MousePointer, Type, Search, FileText, Camera, Trash2,
    Code, Send, RefreshCcw, Cookie, AlignJustify, Zap, Network, Keyboard, AlertOctagon
} from 'lucide-react';

const icons: Record<string, any> = {
  open: Globe,
  wait: Clock,
  click: MousePointer,
  type: Type,
  grep: Search,
  grep_regex: Search,
  extract_text: FileText,
  screenshot: Camera,
  execute_js: Code,
  http_request: Network,
  send_notification: Send,
  press_key: Keyboard,
  scroll: AlignJustify,
  refresh: RefreshCcw,
  wait_network_idle: Clock,
  clear_cookies: Cookie,
  set_header: Code,
  expect_http_status: AlertOctagon,
  capture_network: Network
};

export const CustomNode = ({ data, selected, id }: any) => {
  const Icon = icons[data.step.action] || Globe;
  const fields = data.fields || [];

  return (
    <div className={cn("min-w-[250px]", selected && "ring-2 ring-primary rounded-lg")}>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-3 !h-3" />
      
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0 bg-secondary/30">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm capitalize">{data.label}</span>
          </div>
          {data.onDelete && (
             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={data.onDelete}>
                 <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
             </Button>
          )}
        </CardHeader>
        
        <CardContent className="p-3 space-y-3">
            {fields.map((field: any) => (
                <div key={field.name} className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{field.name}</Label>
                    {field.type === 'boolean' ? (
                        <div className="flex items-center space-x-2 pt-1">
                            <input 
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={data.step[field.name] ?? true}
                                onChange={(e) => data.onChange(field.name, e.target.checked)}
                            />
                            <span className="text-[10px] text-muted-foreground">Enable</span>
                        </div>
                    ) : (
                        <Input 
                            className="h-7 text-xs"
                            value={data.step[field.name] || ''}
                            onChange={(e) => data.onChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                            placeholder={field.placeholder}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            ))}
            {fields.length === 0 && <div className="text-xs text-muted-foreground italic">No parameters</div>}
        </CardContent>
      </Card>
      
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-3 !h-3" />
    </div>
  );
};
