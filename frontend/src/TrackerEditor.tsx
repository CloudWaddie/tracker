import { useState } from 'react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import { Label } from './components/ui/label';
import { Trash2, Plus, Save, X } from 'lucide-react';

interface Step {
  action: string;
  [key: string]: any;
}

interface TrackerEditorProps {
  onSave: (trackerData: any) => void;
  onCancel: () => void;
}

const AVAILABLE_ACTIONS = [
  { value: 'open', label: 'Open URL', fields: [{ name: 'url', type: 'text', placeholder: 'https://example.com' }] },
  { value: 'wait', label: 'Wait', fields: [{ name: 'seconds', type: 'number', placeholder: 'Seconds' }] },
  { value: 'click', label: 'Click Element', fields: [{ name: 'selector', type: 'text', placeholder: 'CSS Selector' }] },
  { value: 'type', label: 'Type Text', fields: [{ name: 'selector', type: 'text', placeholder: 'CSS Selector' }, { name: 'text', type: 'text', placeholder: 'Text to type' }] },
  { value: 'grep', label: 'Grep (Check Text)', fields: [{ name: 'text', type: 'text', placeholder: 'Text to find' }, { name: 'selector', type: 'text', placeholder: 'Selector (optional, default body)' }] },
  { value: 'extract_text', label: 'Extract Text to Variable', fields: [{ name: 'selector', type: 'text', placeholder: 'CSS Selector' }, { name: 'variable', type: 'text', placeholder: 'Variable Name (e.g. price)' }] },
  { value: 'screenshot', label: 'Take Screenshot', fields: [{ name: 'path', type: 'text', placeholder: 'Path (e.g. screenshot.png)' }] },
];

export const TrackerEditor = ({ onSave, onCancel }: TrackerEditorProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [scheduleCron, setScheduleCron] = useState('');

  const addStep = (actionType: string) => {
    setSteps([...steps, { action: actionType }]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      config: steps,
      schedule_cron: scheduleCron || null,
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
            <h2 className="text-2xl font-semibold tracking-tight">Create New Tracker</h2>
        </CardHeader>
        <CardContent className="grid gap-4">
            <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Tracker" />
            </div>

            <div className="grid gap-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
            </div>

            <div className="grid gap-2">
                <Label>Schedule (Cron)</Label>
                <Input value={scheduleCron} onChange={(e) => setScheduleCron(e.target.value)} placeholder="0 * * * *" />
            </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Steps</h3>
            <div className="flex gap-2">
                 <select 
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onChange={(e) => {
                        if (e.target.value) {
                            addStep(e.target.value);
                            e.target.value = '';
                        }
                    }}
                >
                    <option value="">+ Add Step...</option>
                    {AVAILABLE_ACTIONS.map(action => (
                        <option key={action.value} value={action.value}>{action.label}</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="grid gap-4">
            {steps.map((step, index) => {
            const actionDef = AVAILABLE_ACTIONS.find(a => a.value === step.action);
            return (
                <Card key={index} className="relative">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeStep(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                
                <CardHeader className="py-4">
                    <div className="flex items-center gap-2 font-medium">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                            {index + 1}
                        </span>
                        {actionDef?.label || step.action}
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 pb-6">
                    {actionDef?.fields.map((field) => (
                    <div key={field.name} className="grid gap-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">{field.name}</Label>
                        <Input 
                        type={field.type}
                        value={step[field.name] || ''}
                        onChange={(e) => updateStep(index, field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                        placeholder={field.placeholder}
                        />
                    </div>
                    ))}
                </CardContent>
                </Card>
            );
            })}
            {steps.length === 0 && (
                <div className="text-center py-8 border border-dashed rounded-lg text-muted-foreground">
                    No steps added yet.
                </div>
            )}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
            Cancel
        </Button>
        <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save Tracker
        </Button>
      </div>
    </div>
  );
};
