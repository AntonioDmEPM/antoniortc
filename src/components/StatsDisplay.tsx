import { Card } from '@/components/ui/card';
import { SessionStats } from '@/utils/webrtcAudio';

interface StatsDisplayProps {
  title: string;
  stats: SessionStats;
}

export default function StatsDisplay({ title, stats }: StatsDisplayProps) {
  return (
    <Card className="p-6 shadow-card">
      <h2 className="text-xl font-semibold mb-6 pb-3 border-b">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3 p-4 bg-secondary rounded-lg">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Input Tokens
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Audio:</span>
              <span className="font-semibold text-primary">
                {stats.audioInputTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Text:</span>
              <span className="font-semibold text-primary">
                {stats.textInputTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cached:</span>
              <span className="font-semibold text-primary">
                {stats.cachedInputTokens.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-secondary rounded-lg">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Output Tokens
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Audio:</span>
              <span className="font-semibold text-primary">
                {stats.audioOutputTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Text:</span>
              <span className="font-semibold text-primary">
                {stats.textOutputTokens.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-secondary rounded-lg">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Costs
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Input:</span>
              <span className="font-semibold text-primary">
                ${stats.inputCost.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Output:</span>
              <span className="font-semibold text-primary">
                ${stats.outputCost.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-medium pt-2 border-t">
              <span>Total:</span>
              <span className="text-lg text-primary">
                ${stats.totalCost.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
