import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Save, FolderOpen, Trash2 } from 'lucide-react';
import { SessionStats, PricingConfig } from '@/utils/webrtcAudio';
import { TimelineSegment } from '@/components/ConversationTimeline';
import { TokenDataPoint } from '@/components/TokenDashboard';

interface SavedSession {
  id: string;
  created_at: string;
  name: string;
  model: string;
  voice: string;
  bot_prompt: string;
  pricing_config: PricingConfig;
  session_stats: SessionStats;
  timeline_segments: TimelineSegment[];
  token_data_points: TokenDataPoint[];
  events: any[];
  session_start_time: number | null;
  session_end_time: number | null;
  duration_ms: number | null;
}

interface SessionManagerProps {
  currentModel: string;
  currentVoice: string;
  currentPrompt: string;
  currentPricingConfig: PricingConfig;
  sessionStats: SessionStats;
  timelineSegments: TimelineSegment[];
  tokenDataPoints: TokenDataPoint[];
  events: any[];
  sessionStartTime: number | null;
  onLoadSession: (session: SavedSession) => void;
  isConnected: boolean;
}

export default function SessionManager({
  currentModel,
  currentVoice,
  currentPrompt,
  currentPricingConfig,
  sessionStats,
  timelineSegments,
  tokenDataPoints,
  events,
  sessionStartTime,
  onLoadSession,
  isConnected,
}: SessionManagerProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load sessions',
        variant: 'destructive',
      });
      return;
    }

    setSessions((data || []) as unknown as SavedSession[]);
  };

  const saveSession = async () => {
    if (!sessionName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a session name',
        variant: 'destructive',
      });
      return;
    }

    const sessionData = {
      name: sessionName.trim(),
      model: currentModel,
      voice: currentVoice,
      bot_prompt: currentPrompt,
      pricing_config: currentPricingConfig as any,
      session_stats: sessionStats as any,
      timeline_segments: timelineSegments as any,
      token_data_points: tokenDataPoints as any,
      events: events as any,
      session_start_time: sessionStartTime,
      session_end_time: sessionStartTime ? Date.now() : null,
      duration_ms: sessionStartTime ? Date.now() - sessionStartTime : null,
    };

    const { error } = await supabase
      .from('sessions')
      .insert([sessionData]);

    if (error) {
      console.error('Error saving session:', error);
      toast({
        title: 'Error',
        description: 'Failed to save session',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Session saved successfully',
    });

    setSessionName('');
    setIsSaveDialogOpen(false);
    loadSessions();
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete session',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Session deleted successfully',
    });

    loadSessions();
  };

  const loadSession = (session: SavedSession) => {
    if (isConnected) {
      toast({
        title: 'Warning',
        description: 'Please disconnect current session before loading a saved one',
        variant: 'destructive',
      });
      return;
    }

    onLoadSession(session);
    setIsLoadDialogOpen(false);
    toast({
      title: 'Success',
      description: 'Session loaded successfully',
    });
  };

  return (
    <div className="flex gap-2">
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={isConnected}>
            <Save className="h-4 w-4 mr-2" />
            Save Session
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Session</DialogTitle>
            <DialogDescription>
              Save all session data, parameters, and statistics for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter session name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSession}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={isConnected}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Load Session
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Saved Session</DialogTitle>
            <DialogDescription>
              Select a previously saved session to restore all its parameters and data
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No saved sessions found
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <Card key={session.id}>
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base">{session.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {new Date(session.created_at).toLocaleString()}
                          </CardDescription>
                          <div className="text-xs text-muted-foreground space-y-1 mt-2">
                            <div>Model: {session.model}</div>
                            <div>Voice: {session.voice}</div>
                            <div>
                              Total Cost: ${session.session_stats.totalCost.toFixed(4)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadSession(session)}
                          >
                            Load
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
