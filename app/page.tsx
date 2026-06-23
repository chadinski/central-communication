import { Dashboard } from "@/components/Dashboard";
import { getCalls, getMessages } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [messages, calls] = await Promise.all([getMessages(), getCalls()]);
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER || "TWILIO_PHONE_NUMBER";

  return (
    <Dashboard
      initialMessages={messages}
      initialCalls={calls}
      twilioNumber={twilioNumber}
    />
  );
}
