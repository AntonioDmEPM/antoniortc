import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export interface TimelineSegment {
  start: number;
  end: number;
  speaker: 'user' | 'assistant';
  duration: number;
}

interface ConversationTimelineProps {
  segments: TimelineSegment[];
  sessionStartTime: number | null;
}

export default function ConversationTimeline({ segments, sessionStartTime }: ConversationTimelineProps) {
  if (!sessionStartTime || segments.length === 0) {
    return (
      <Card className="p-6 shadow-card bg-card/50 backdrop-blur-sm border-primary/20">
        <h2 className="text-xl font-semibold mb-4">Conversation Timeline</h2>
        <p className="text-muted-foreground text-center py-8">
          Start a conversation to see the timeline visualization
        </p>
      </Card>
    );
  }

  const chartData = segments.map((segment, index) => ({
    name: `${index + 1}`,
    start: (segment.start - sessionStartTime) / 1000,
    duration: segment.duration / 1000,
    speaker: segment.speaker,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold">
            {data.speaker === 'user' ? 'User' : 'Assistant'}
          </p>
          <p className="text-sm text-muted-foreground">
            Start: {data.start.toFixed(1)}s
          </p>
          <p className="text-sm text-muted-foreground">
            Duration: {data.duration.toFixed(1)}s
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6 shadow-card bg-card/50 backdrop-blur-sm border-primary/20">
      <h2 className="text-xl font-semibold mb-6 pb-3 border-b">Conversation Timeline</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="start" 
            label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
            className="text-xs"
          />
          <YAxis 
            dataKey="duration"
            label={{ value: 'Duration (seconds)', angle: -90, position: 'insideLeft' }}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value) => value === 'user' ? 'User' : 'Assistant'}
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Bar dataKey="duration" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.speaker === 'user' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--primary))' }}></div>
          <span>User</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--secondary))' }}></div>
          <span>Assistant</span>
        </div>
      </div>
    </Card>
  );
}
