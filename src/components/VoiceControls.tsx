import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface VoiceControlsProps {
  onStart: (token: string, voice: string) => void;
  onStop: () => void;
  isConnected: boolean;
  statusMessage: string;
  statusType: 'idle' | 'success' | 'error' | 'connecting';
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

  useEffect(() => {
    const savedToken = localStorage.getItem('openai_api_key');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleStart = () => {
    if (!token) return;
    localStorage.setItem('openai_api_key', token);
    onStart(token, voice);
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
