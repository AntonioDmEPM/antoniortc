import { useState, useEffect } from 'react';
import VoiceControls from '@/components/VoiceControls';
import StatsDisplay from '@/components/StatsDisplay';
import EventLog from '@/components/EventLog';
import AudioIndicator from '@/components/AudioIndicator';
import PricingSettings from '@/components/PricingSettings';
import PromptSettings from '@/components/PromptSettings';
import ConversationTimer from '@/components/ConversationTimer';
import ConversationTimeline, { TimelineSegment } from '@/components/ConversationTimeline';
import TokenDashboard, { TokenDataPoint } from '@/components/TokenDashboard';
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
  
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [timelineSegments, setTimelineSegments] = useState<TimelineSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState<Partial<TimelineSegment> | null>(null);
  const [tokenDataPoints, setTokenDataPoints] = useState<TokenDataPoint[]>([]);
  const [cumulativeTokens, setCumulativeTokens] = useState({ input: 0, output: 0 });

  const addEvent = (data: any) => {
    const entry: EventEntry = {
      timestamp: new Date().toISOString(),
      data,
    };
    setEvents((prev) => [entry, ...prev.slice(0, 49)]);
  };

  const handleMessage = (eventData: UsageEvent) => {
    addEvent(eventData);

    // Track timeline segments
    if (eventData.type === 'input_audio_buffer.speech_started') {
      setCurrentSegment({
        start: Date.now(),
        speaker: 'user',
      });
    } else if (eventData.type === 'input_audio_buffer.speech_stopped') {
      if (currentSegment?.start && currentSegment.speaker === 'user') {
        const end = Date.now();
        setTimelineSegments(prev => [...prev, {
          start: currentSegment.start,
          end,
          duration: end - currentSegment.start,
          speaker: 'user',
        }]);
        setCurrentSegment(null);
      }
    } else if (eventData.type === 'response.audio.delta') {
      if (!currentSegment || currentSegment.speaker !== 'assistant') {
        setCurrentSegment({
          start: Date.now(),
          speaker: 'assistant',
        });
      }
    } else if (eventData.type === 'response.audio.done') {
      if (currentSegment?.start && currentSegment.speaker === 'assistant') {
        const end = Date.now();
        setTimelineSegments(prev => [...prev, {
          start: currentSegment.start,
          end,
          duration: end - currentSegment.start,
          speaker: 'assistant',
        }]);
        setCurrentSegment(null);
      }
    }

    if (eventData.type === 'response.done' && eventData.response?.usage) {
      console.log('=== RESPONSE.DONE EVENT ===');
      console.log('Full event:', JSON.stringify(eventData, null, 2));
      
      const usage = eventData.response.usage;
      console.log('Usage object:', usage);
      
      const inputDetails = usage.input_token_details;
      const outputDetails = usage.output_token_details;
      const cachedDetails = inputDetails.cached_tokens_details || { audio_tokens: 0, text_tokens: 0 };

      console.log('Input details:', inputDetails);
      console.log('Output details:', outputDetails);
      console.log('Cached details:', cachedDetails);

      const newStats = {
        audioInputTokens: inputDetails.audio_tokens - cachedDetails.audio_tokens,
        textInputTokens: inputDetails.text_tokens - cachedDetails.text_tokens,
        cachedInputTokens: inputDetails.cached_tokens || 0,
        audioOutputTokens: outputDetails.audio_tokens,
        textOutputTokens: outputDetails.text_tokens,
      };

      console.log('Calculated newStats:', newStats);

      const costs = calculateCosts(newStats, pricingConfig);
      const fullStats = { ...newStats, ...costs };

      setCurrentStats(fullStats);
      setSessionStats((prev) => {
        const updated = {
          audioInputTokens: prev.audioInputTokens + newStats.audioInputTokens,
          textInputTokens: prev.textInputTokens + newStats.textInputTokens,
          cachedInputTokens: prev.cachedInputTokens + newStats.cachedInputTokens,
          audioOutputTokens: prev.audioOutputTokens + newStats.audioOutputTokens,
          textOutputTokens: prev.textOutputTokens + newStats.textOutputTokens,
          inputCost: prev.inputCost + costs.inputCost,
          outputCost: prev.outputCost + costs.outputCost,
          totalCost: prev.totalCost + costs.totalCost,
        };
        console.log('Previous session stats:', prev);
        console.log('Updated session stats:', updated);
        return updated;
      });

      // Track token data points for dashboard
      if (sessionStartTime) {
        const totalInput = newStats.audioInputTokens + newStats.textInputTokens;
        const totalOutput = newStats.audioOutputTokens + newStats.textOutputTokens;
        
        const newCumulativeInput = cumulativeTokens.input + totalInput;
        const newCumulativeOutput = cumulativeTokens.output + totalOutput;
        
        setCumulativeTokens({
          input: newCumulativeInput,
          output: newCumulativeOutput,
        });

        const dataPoint: TokenDataPoint = {
          timestamp: Date.now(),
          elapsedSeconds: (Date.now() - sessionStartTime) / 1000,
          inputTokens: totalInput,
          outputTokens: totalOutput,
          cumulativeInput: newCumulativeInput,
          cumulativeOutput: newCumulativeOutput,
        };

        setTokenDataPoints(prev => [...prev, dataPoint]);
      }
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

      const pc = await createRealtimeSession(stream, token, voice, model, botPrompt, handleMessage);
      setPeerConnection(pc);

      setIsConnected(true);
      setSessionStartTime(Date.now());
      setTokenDataPoints([]);
      setCumulativeTokens({ input: 0, output: 0 });
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
    setSessionStartTime(null);
    setCurrentSegment(null);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const resetSessionTotals = () => {
    setSessionStats(initialStats);
    setTimelineSegments([]);
    setTokenDataPoints([]);
    setCumulativeTokens({ input: 0, output: 0 });
    toast({
      title: 'Session Totals Reset',
      description: 'All session statistics have been cleared',
    });
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
              <ConversationTimer isActive={isConnected} startTime={sessionStartTime} />
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
            <StatsDisplay 
              title="Session Total" 
              stats={sessionStats}
              onReset={resetSessionTotals}
              resetDisabled={isConnected}
            />
          </div>

          <div className="text-sm text-muted-foreground italic">
            Note: Cost calculations are estimates based on published rates and may not be 100% accurate.
          </div>

          <TokenDashboard 
            dataPoints={tokenDataPoints}
            sessionStartTime={sessionStartTime}
            isActive={isConnected}
            totalInputTokens={sessionStats.audioInputTokens + sessionStats.textInputTokens}
            totalOutputTokens={sessionStats.audioOutputTokens + sessionStats.textOutputTokens}
          />

          <ConversationTimeline segments={timelineSegments} sessionStartTime={sessionStartTime} />

          <EventLog events={events} onClearEvents={clearEvents} />
        </div>
      </div>
    </div>
  );
}
