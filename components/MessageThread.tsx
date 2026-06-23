"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoredMessage } from "@/lib/store";

type MessageThreadProps = {
  messages: StoredMessage[];
  twilioNumber: string;
  selectedSender?: string | null;
  onSelectSender: (sender: string) => void;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function contactFor(message: StoredMessage, twilioNumber: string) {
  if (message.direction === "outbound") {
    return message.to ?? "Unknown";
  }

  return message.from === twilioNumber ? message.to ?? message.from : message.from;
}

export function groupMessages(messages: StoredMessage[], twilioNumber: string) {
  const groups = new Map<string, StoredMessage[]>();
  for (const message of messages) {
    const contact = contactFor(message, twilioNumber);
    groups.set(contact, [...(groups.get(contact) ?? []), message]);
  }

  return Array.from(groups.entries())
    .map(([sender, threadMessages]) => ({
      sender,
      messages: threadMessages.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
      latest: threadMessages.reduce((latestMessage, message) =>
        new Date(message.timestamp) > new Date(latestMessage.timestamp)
          ? message
          : latestMessage
      )
    }))
    .sort(
      (a, b) =>
        new Date(b.latest.timestamp).getTime() -
        new Date(a.latest.timestamp).getTime()
    );
}

export function MessageThread({
  messages,
  twilioNumber,
  selectedSender,
  onSelectSender
}: MessageThreadProps) {
  const threads = groupMessages(messages, twilioNumber);
  const activeThread =
    threads.find((thread) => thread.sender === selectedSender) ?? threads[0];

  if (threads.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No messages yet. Incoming texts will appear here after Twilio posts to
          your webhook.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Threads</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[440px]">
            <div className="space-y-1 p-2">
              {threads.map((thread) => (
                <button
                  key={thread.sender}
                  type="button"
                  onClick={() => onSelectSender(thread.sender)}
                  className="w-full rounded-md px-3 py-3 text-left transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[selected=true]:bg-accent"
                  data-selected={activeThread?.sender === thread.sender}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{thread.sender}</span>
                    <Badge variant="secondary">{thread.messages.length}</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {thread.latest.body}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{activeThread?.sender}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[440px] pr-4">
            <div className="space-y-4">
              {activeThread?.messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.direction === "outbound"
                      ? "ml-auto max-w-[82%] text-right"
                      : "mr-auto max-w-[82%]"
                  }
                >
                  <div
                    className={
                      message.direction === "outbound"
                        ? "rounded-lg bg-primary px-4 py-3 text-primary-foreground"
                        : "rounded-lg bg-muted px-4 py-3"
                    }
                  >
                    <p className="whitespace-pre-wrap text-sm leading-6">
                      {message.body}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
