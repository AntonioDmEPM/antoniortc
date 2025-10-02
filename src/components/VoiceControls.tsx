import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface VoiceControlsProps {
  onStart: (token: string, voice: string, model: string) => void;
  onStop: () => void;
  isConnected: boolean;
  statusMessage: string;
  statusType: 'idle' | 'success' | 'error' | 'connecting';
}

interface RealtimeModel {
  id: string;
  name: string;
}

const VOICES = [
  { value: 'ash', label: 'Ash' },
  { value: 'ballad', label: 'Ballad' },
  { value: 'coral', label: 'Coral' },
  { value: 'sage', label: 'Sage' },
  { value: 'verse', label: 'Verse' },
];

export default function VoiceControls({
  onStart,
  onStop,
  isConnected,
  statusMessage,
  statusType,
}: VoiceControlsProps) {
  const [token, setToken] = useState('');
  const [voice, setVoice] = useState('ash');
  const [model, setModel] = useState('gpt-4o-realtime-preview-2024-12-17');
  const [models, setModels] = useState<RealtimeModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('openai_api_key');
    if (savedToken) {
      setToken(savedToken);
      fetchModels(savedToken);
    }
  }, []);

  const fetchModels = async (apiToken: string) => {
    setLoadingModels(true);
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const realtimeModels = data.data
          .filter((m: any) => m.id.includes('realtime'))
          .map((m: any) => ({ id: m.id, name: m.id }));
        setModels(realtimeModels);
        
        if (realtimeModels.length > 0 && !model) {
          setModel(realtimeModels[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleStart = () => {
    if (!token) return;
    localStorage.setItem('openai_api_key', token);
    if (models.length === 0) {
      fetchModels(token);
    }
    onStart(token, voice, model);
  };

  const getStatusColor = () => {
    switch (statusType) {
      case 'success':
        return 'text-accent';
      case 'error':
        return 'text-destructive';
      case 'connecting':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token">OpenAI API Token</Label>
          <Input
            id="token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={isConnected}
            placeholder="sk-..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={model} onValueChange={setModel} disabled={isConnected || loadingModels}>
            <SelectTrigger id="model">
              <SelectValue placeholder={loadingModels ? "Loading models..." : "Select model"} />
            </SelectTrigger>
            <SelectContent>
              {models.length > 0 ? (
                models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="gpt-4o-realtime-preview-2024-12-17">
                  gpt-4o-realtime-preview-2024-12-17
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice">Voice</Label>
          <Select value={voice} onValueChange={setVoice} disabled={isConnected}>
            <SelectTrigger id="voice">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICES.map((v) => (
                <SelectItem key={v.value} value={v.value}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={isConnected ? onStop : handleStart}
          disabled={!isConnected && !token}
          className="w-full"
          variant={isConnected ? 'destructive' : 'default'}
        >
          {isConnected ? 'Stop Session' : 'Start Session'}
        </Button>

        {statusMessage && (
          <p className={`text-sm font-medium transition-smooth ${getStatusColor()}`}>
            {statusMessage}
          </p>
        )}
      </div>
    </Card>
  );
}
