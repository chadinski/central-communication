"use client";

import { FormEvent, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SendMessageProps = {
  defaultTo?: string;
  onSent: () => Promise<void> | void;
};

export function SendMessage({ defaultTo = "", onSent }: SendMessageProps) {
  const [to, setTo] = useState(defaultTo);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setTo(defaultTo);
  }, [defaultTo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsSending(true);

    const response = await fetch("/api/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ to, body })
    });
    const data = (await response.json()) as {
      success: boolean;
      error?: string;
    };

    setIsSending(false);
    if (!response.ok || !data.success) {
      setStatus(data.error ?? "Unable to send message");
      return;
    }

    setBody("");
    setStatus("Sent");
    await onSent();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto]">
        <label className="sr-only" htmlFor="sms-to">
          Recipient phone number
        </label>
        <Input
          id="sms-to"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder="+15551234567"
          autoComplete="tel"
        />
        <label className="sr-only" htmlFor="sms-body">
          Message body
        </label>
        <Input
          id="sms-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Type a reply"
        />
        <Button type="submit" disabled={isSending}>
          <Send className="mr-2 h-4 w-4" aria-hidden="true" />
          {isSending ? "Sending" : "Send"}
        </Button>
      </div>
      {status ? (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
    </form>
  );
}
