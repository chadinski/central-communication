"use client";

import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function RelaySetup() {
  const [origin, setOrigin] = useState("");
  const relayUrl = origin ? `${origin}/api/relay/sms` : "/api/relay/sms";

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carrier SMS relay</CardTitle>
        <CardDescription>
          Forward SMS from a real SIM/eSIM phone into this inbox with a private
          webhook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="relay-webhook">
            Relay endpoint
          </label>
          <div className="flex gap-2">
            <Input id="relay-webhook" value={relayUrl} readOnly />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Copy relay webhook URL"
              onClick={() => copy(relayUrl)}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">
          Send JSON with `from` and `body`, plus header
          `x-relay-secret: RELAY_SECRET`. Use this with a carrier phone SMS
          forwarder so OTPs arrive here after the phone receives them.
        </div>
      </CardContent>
    </Card>
  );
}
