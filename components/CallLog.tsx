"use client";

import { PhoneIncoming } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoredCall } from "@/lib/store";

type CallLogProps = {
  calls: StoredCall[];
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function CallLog({ calls }: CallLogProps) {
  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No calls logged yet. Inbound calls will show here as Twilio forwards
          them.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-[540px]">
          <div className="divide-y divide-border">
            {calls.map((call) => (
              <div
                key={call.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <PhoneIncoming className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium">{call.from}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(call.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {call.duration ? (
                    <Badge variant="secondary">{call.duration}s</Badge>
                  ) : null}
                  {call.status ? <Badge variant="outline">{call.status}</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
