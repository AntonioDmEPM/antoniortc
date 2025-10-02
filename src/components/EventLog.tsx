import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EventEntry {
  timestamp: string;
  data: any;
}

interface EventLogProps {
  events: EventEntry[];
}

export default function EventLog({ events }: EventLogProps) {
  return (
    <Card className="p-6 shadow-card">
      <h2 className="text-xl font-semibold mb-4">Session Events</h2>
      <ScrollArea className="h-[400px] w-full rounded-lg border">
        <div className="p-4 space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events yet. Start a session to see events.
            </p>
          ) : (
            events.map((event, index) => (
              <div
                key={index}
                className="font-mono text-xs p-4 bg-secondary rounded-lg border-l-4 border-primary"
              >
                <div className="text-muted-foreground mb-2">{event.timestamp}</div>
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
