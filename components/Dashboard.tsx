"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CallLog } from "@/components/CallLog";
import { MessageThread, groupMessages } from "@/components/MessageThread";
import { SendMessage } from "@/components/SendMessage";
import { WebhookSetup } from "@/components/WebhookSetup";
import { StoredCall, StoredMessage } from "@/lib/store";

type DashboardProps = {
  initialMessages: StoredMessage[];
  initialCalls: StoredCall[];
  twilioNumber: string;
};

async function fetchMessages() {
  const response = await fetch("/api/sms", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load messages");
  }

  const data = (await response.json()) as { messages: StoredMessage[] };
  return data.messages;
}

async function fetchCalls() {
  const response = await fetch("/api/call", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load calls");
  }

  const data = (await response.json()) as { calls: StoredCall[] };
  return data.calls;
}

export function Dashboard({
  initialMessages,
  initialCalls,
  twilioNumber
}: DashboardProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [calls, setCalls] = useState(initialCalls);
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const threads = useMemo(
    () => groupMessages(messages, twilioNumber),
    [messages, twilioNumber]
  );
  const activeSender = selectedSender ?? threads[0]?.sender ?? "";

  async function refresh() {
    setIsRefreshing(true);
    setError(null);

    try {
      const [nextMessages, nextCalls] = await Promise.all([
        fetchMessages(),
        fetchCalls()
      ]);
      setMessages(nextMessages);
      setCalls(nextCalls);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh dashboard"
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(169_78%_12%),transparent_32rem)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardDescription>Personal Twilio number</CardDescription>
              <CardTitle className="mt-2 flex flex-wrap items-center gap-3 text-2xl sm:text-3xl">
                <Smartphone className="h-7 w-7 text-primary" aria-hidden="true" />
                {twilioNumber}
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                {messages.length} messages
              </Badge>
              <Badge variant="secondary">{calls.length} calls</Badge>
              <Button
                type="button"
                variant="outline"
                onClick={refresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                Refresh
              </Button>
            </div>
          </CardHeader>
          {error ? (
            <CardContent>
              <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {error}
              </p>
            </CardContent>
          ) : null}
        </Card>

        <WebhookSetup />

        <Tabs defaultValue="messages">
          <TabsList>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
          </TabsList>
          <TabsContent value="messages" className="space-y-4">
            <MessageThread
              messages={messages}
              twilioNumber={twilioNumber}
              selectedSender={activeSender}
              onSelectSender={setSelectedSender}
            />
            <Card>
              <CardHeader>
                <CardTitle>Reply</CardTitle>
                <CardDescription>
                  Send from your Twilio number. Credentials stay on the server.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SendMessage defaultTo={activeSender} onSent={refresh} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="calls">
            <CallLog calls={calls} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
