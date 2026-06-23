"use client";

import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function endpoint(origin: string, path: string) {
  return origin ? `${origin}${path}` : path;
}

export function WebhookSetup() {
  const [origin, setOrigin] = useState("");
  const smsUrl = endpoint(origin, "/api/sms");
  const voiceUrl = endpoint(origin, "/api/call");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook setup</CardTitle>
        <CardDescription>
          Open the app through ngrok and use these public URLs in Twilio.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="sms-webhook">
            Messaging: A message comes in
          </label>
          <div className="flex gap-2">
            <Input id="sms-webhook" value={smsUrl} readOnly />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy SMS webhook URL"
              onClick={() => copy(smsUrl)}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="voice-webhook">
            Voice: A call comes in
          </label>
          <div className="flex gap-2">
            <Input id="voice-webhook" value={voiceUrl} readOnly />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy voice webhook URL"
              onClick={() => copy(voiceUrl)}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
