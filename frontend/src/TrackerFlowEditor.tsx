import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  ReactFlowProvider,
  type ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Save, GripVertical } from 'lucide-react';
import { CustomNode } from './components/CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

const AVAILABLE_ACTIONS = [
  { 
    value: 'open', 
    label: 'Open URL', 
    fields: [
        { name: 'url', type: 'text', placeholder: 'https://example.com' },
        { name: 'headless', type: 'boolean', placeholder: 'Headless mode' }
    ] 
  },
  { value: 'wait', label: 'Wait', fields: [{ name: 'seconds', type: 'number', placeholder: 'Seconds' }] },
  { value: 'click', label: 'Click Element', fields: [{ name: 'selector', type: 'text', placeholder: 'CSS Selector' }] },
  { value: 'type', label: 'Type Text', fields: [{ name: 'selector', type: 'text', placeholder: 'CSS Selector' }, { name: 'text', type: 'text', placeholder: 'Text to type' }] },
  { value: 'press_key', label: 'Press Key', fields: [{ name: 'key', type: 'text', placeholder: 'Key (Enter, Escape, etc.)' }] },
  { value: 'scroll', label: 'Scroll To', fields: [{ name: 'selector', type: 'text', placeholder: 'CSS Selector' }] },
  { value: 'refresh', label: 'Refresh Page', fields: [] },
  { value: 'wait_network_idle', label: 'Wait Network Idle', fields: [] },
  { value: 'clear_cookies', label: 'Clear Cookies', fields: [] },
  { value: 'set_header', label: 'Set Header', fields: [{ name: 'key', type: 'text', placeholder: 'Header Name' }, { name: 'value', type: 'text', placeholder: 'Header Value' }] },
  { value: 'grep', label: 'Grep (Check Text)', fields: [{ name: 'text', type: 'text', placeholder: 'Text to find' }, { name: 'selector', type: 'text', placeholder: 'Selector (optional, default body)' }] },
  { value: 'grep_regex', label: 'Grep (Regex)', fields: [{ name: 'regex', type: 'text', placeholder: 'Regex Pattern' }, { name: 'selector', type: 'text', placeholder: 'Selector (optional, default body)' }] },
  { value: 'extract_text', label: 'Extract Text', fields: [{ name: 'selector', type: 'text', placeholder: 'CSS Selector' }, { name: 'variable', type: 'text', placeholder: 'Variable Name' }] },
  { value: 'execute_js', label: 'Execute JS', fields: [{ name: 'script', type: 'text', placeholder: 'return document.title;' }, { name: 'variable', type: 'text', placeholder: 'Result Variable (Optional)' }] },
  { value: 'capture_network', label: 'Capture Network', fields: [{ name: 'regex', type: 'text', placeholder: 'URL Regex Pattern' }] },
  { value: 'http_request', label: 'HTTP Request', fields: [{ name: 'method', type: 'text', placeholder: 'GET/POST' }, { name: 'url', type: 'text', placeholder: 'URL' }, { name: 'body', type: 'text', placeholder: 'JSON Body (Optional)' }, { name: 'variable', type: 'text', placeholder: 'Response Variable' }] },
  { value: 'expect_http_status', label: 'Expect HTTP Status', fields: [{ name: 'status', type: 'number', placeholder: 'Status Code (e.g. 200)' }] },
  { value: 'send_notification', label: 'Send Notification', fields: [{ name: 'message', type: 'text', placeholder: 'Message' }] },
  { value: 'screenshot', label: 'Screenshot', fields: [{ name: 'path', type: 'text', placeholder: 'Path' }] },
];

interface TrackerFlowEditorProps {
  onSave: (trackerData: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const FlowEditorContent = ({ onSave, onCancel, initialData }: TrackerFlowEditorProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [scheduleCron, setScheduleCron] = useState(initialData?.schedule_cron || '');
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Load initial data
  useEffect(() => {
    if (initialData?.config && nodes.length === 0) {
        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];
        let y = 50;
        
        initialData.config.forEach((step: any, index: number) => {
            const id = `${Date.now() + index}`;
            const actionDef = AVAILABLE_ACTIONS.find(a => a.value === step.action);
            
            initialNodes.push({
                id,
                type: 'custom',
                position: { x: 250, y },
                data: {
                    label: actionDef?.label || step.action,
                    step: { ...step },
                    fields: actionDef?.fields || [],
                    onChange: (field: string, value: any) => onNodeDataChange(id, field, value),
                    onDelete: () => onDeleteNode(id)
                }
            });
            
            if (index > 0) {
                initialEdges.push({
                    id: `e${initialNodes[index-1].id}-${id}`,
                    source: initialNodes[index-1].id,
                    target: id,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed }
                });
            }
            y += 150;
        });
        
        setNodes(initialNodes);
        setEdges(initialEdges);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]); // Run once when initialData is provided

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges],
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Update node data from within the CustomNode
  const onNodeDataChange = useCallback((id: string, field: string, value: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              step: { ...node.data.step, [field]: value }
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
  }, [setNodes]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const actionDef = AVAILABLE_ACTIONS.find(a => a.value === type);
      const nodeId = `${Date.now()}`;
      
      const newNode: Node = {
        id: nodeId,
        type: 'custom',
        position,
        data: { 
            label: actionDef?.label || type, 
            step: { action: type },
            fields: actionDef?.fields || [],
            onChange: (field: string, value: any) => onNodeDataChange(nodeId, field, value),
            onDelete: () => onDeleteNode(nodeId)
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, onNodeDataChange, onDeleteNode],
  );

  const getStepsFromNodes = () => {
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);
    return sortedNodes.map(node => node.data.step);
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      config: getStepsFromNodes(),
      schedule_cron: scheduleCron || null,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-card z-10">
        <div>
            <h2 className="text-xl font-bold">Flow Editor</h2>
            <div className="flex gap-4 mt-2">
                <Input className="w-48 h-8" placeholder="Tracker Name" value={name} onChange={e => setName(e.target.value)} />
                <Input className="w-64 h-8" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
                <Input className="w-32 h-8" placeholder="Cron" value={scheduleCron} onChange={e => setScheduleCron(e.target.value)} />
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
        </div>
      </div>

      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-card p-4 flex flex-col gap-4 z-10">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Building Blocks</h3>
            <p className="text-xs text-muted-foreground">Drag to canvas</p>
            <div className="grid grid-cols-1 gap-2">
                {AVAILABLE_ACTIONS.map(action => (
                    <div
                        key={action.value}
                        draggable
                        onDragStart={(event) => onDragStart(event, action.value)}
                        className="flex items-center p-2 rounded-md bg-secondary/50 cursor-grab hover:bg-secondary border border-transparent hover:border-border transition-colors"
                    >
                        <GripVertical className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{action.label}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Canvas */}
        <div className="flex-grow relative" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background color="#444" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export const TrackerFlowEditor = (props: TrackerFlowEditorProps) => (
    <ReactFlowProvider>
        <FlowEditorContent {...props} />
    </ReactFlowProvider>
);
