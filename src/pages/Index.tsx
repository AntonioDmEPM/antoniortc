import { useState, useEffect } from 'react';
import VoiceControls from '@/components/VoiceControls';
import StatsDisplay from '@/components/StatsDisplay';
import EventLog from '@/components/EventLog';
import AudioIndicator from '@/components/AudioIndicator';
import PricingSettings from '@/components/PricingSettings';
import PromptSettings from '@/components/PromptSettings';
import { createRealtimeSession, AudioVisualizer, calculateCosts, SessionStats, UsageEvent, PricingConfig } from '@/utils/webrtcAudio';
import { useToast } from '@/hooks/use-toast';

interface EventEntry {
  timestamp: string;
  data: any;
}

const initialStats: SessionStats = {
  audioInputTokens: 0,
  textInputTokens: 0,
  cachedInputTokens: 0,
  audioOutputTokens: 0,
  textOutputTokens: 0,
  inputCost: 0,
  outputCost: 0,
  totalCost: 0,
};

export default function Index() {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'idle' | 'success' | 'error' | 'connecting'>('idle');
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [currentStats, setCurrentStats] = useState<SessionStats>(initialStats);
  const [sessionStats, setSessionStats] = useState<SessionStats>(initialStats);
  const [events, setEvents] = useState<EventEntry[]>([]);

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioVisualizer, setAudioVisualizer] = useState<AudioVisualizer | null>(null);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-realtime-preview-2024-12-17');
  const [botPrompt, setBotPrompt] = useState('You are a helpful AI assistant. Be concise and friendly in your responses.');
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>({
    audioInputCost: 0.00004,
    audioOutputCost: 0.00008,
    cachedAudioCost: 0.0000025,
    textInputCost: 0.0000025,
    textOutputCost: 0.00001,
  });

  const addEvent = (data: any) => {
    const entry: EventEntry = {
      timestamp: new Date().toISOString(),
      data,
    };
    setEvents((prev) => [entry, ...prev.slice(0, 49)]);
  };

  const handleMessage = (eventData: UsageEvent) => {
    addEvent(eventData);

    if (eventData.type === 'response.done' && eventData.response?.usage) {
      const usage = eventData.response.usage;
      const inputDetails = usage.input_token_details;
      const outputDetails = usage.output_token_details;
      const cachedDetails = inputDetails.cached_tokens_details;

      const newStats = {
        audioInputTokens: inputDetails.audio_tokens - cachedDetails.audio_tokens,
        textInputTokens: inputDetails.text_tokens - cachedDetails.text_tokens,
        cachedInputTokens: inputDetails.cached_tokens,
        audioOutputTokens: outputDetails.audio_tokens,
        textOutputTokens: outputDetails.text_tokens,
      };

      const costs = calculateCosts(newStats, pricingConfig);
      const fullStats = { ...newStats, ...costs };

      setCurrentStats(fullStats);
      setSessionStats((prev) => ({
        audioInputTokens: prev.audioInputTokens + newStats.audioInputTokens,
        textInputTokens: prev.textInputTokens + newStats.textInputTokens,
        cachedInputTokens: prev.cachedInputTokens + newStats.cachedInputTokens,
        audioOutputTokens: prev.audioOutputTokens + newStats.audioOutputTokens,
        textOutputTokens: prev.textOutputTokens + newStats.textOutputTokens,
        inputCost: prev.inputCost + costs.inputCost,
        outputCost: prev.outputCost + costs.outputCost,
        totalCost: prev.totalCost + costs.totalCost,
      }));
    }
  };

  const startSession = async (token: string, voice: string, model: string) => {
    try {
      setStatusType('connecting');
      setStatusMessage('Requesting microphone access...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      setAudioStream(stream);

      const visualizer = new AudioVisualizer(setIsAudioActive);
      visualizer.setup(stream);
      setAudioVisualizer(visualizer);

      setStatusMessage('Establishing connection...');

      const pc = await createRealtimeSession(stream, token, voice, model, handleMessage);
      setPeerConnection(pc);

      setIsConnected(true);
      setStatusType('success');
      setStatusMessage('Session established successfully!');

      toast({
        title: 'Connected',
        description: 'Voice session is active',
      });
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(`Error: ${err.message}`);
      console.error('Session error:', err);
      stopSession();

      toast({
        title: 'Connection Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const stopSession = () => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    if (audioVisualizer) {
      audioVisualizer.cleanup();
      setAudioVisualizer(null);
    }

    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }

    setIsConnected(false);
    setIsAudioActive(false);
    setStatusType('idle');
    setStatusMessage('');
    setCurrentStats(initialStats);
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <AudioIndicator isActive={isAudioActive} />
            </div>
            <div className="text-right">
              <h2 className="text-4xl md:text-6xl font-bold">
                <span className="text-primary">EPAM AI/Run™</span>.ClarityRTC
              </h2>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <VoiceControls
            onStart={startSession}
            onStop={stopSession}
            isConnected={isConnected}
            statusMessage={statusMessage}
            statusType={statusType}
            onModelChange={setSelectedModel}
          />

          <PromptSettings onPromptChange={setBotPrompt} />

          <PricingSettings 
            onPricingChange={setPricingConfig}
            selectedModel={selectedModel}
          />

          <div className="grid lg:grid-cols-1 gap-6">
            <StatsDisplay title="Most Recent Interaction" stats={currentStats} />
            <StatsDisplay title="Session Total" stats={sessionStats} />
          </div>

          <div className="text-sm text-muted-foreground italic">
            Note: Cost calculations are estimates based on published rates and may not be 100% accurate.
          </div>

          <EventLog events={events} />
        </div>
      </div>
    </div>
  );
}
