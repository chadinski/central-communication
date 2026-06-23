# Personal Phone Number Tool

A local-first Next.js dashboard for a personal Twilio phone number. It receives SMS and call webhooks, stores activity in flat JSON files, forwards calls to your real phone, and lets you send SMS replies from the dashboard.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and fill in your Twilio credentials:

   ```bash
   cp .env.local.example .env.local
   ```

   ```env
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_PHONE_NUMBER=
   MY_REAL_PHONE=
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

4. Expose your local server with ngrok:

   ```bash
   ngrok http 3000
   ```

5. Set your Twilio webhook URLs in the Twilio dashboard:

   - SMS: `https://<ngrok-url>/api/sms`
   - Voice: `https://<ngrok-url>/api/call`

   For the active Twilio number inspected during setup, use `+16092377661` as `TWILIO_PHONE_NUMBER`. The number configuration page fields are:

   - Voice Configuration -> `A call comes in` -> Webhook URL
   - Messaging Configuration -> `A message comes in` -> Webhook URL

   Both should remain `HTTP POST`.

## Routes

- `POST /api/sms`: receives inbound Twilio SMS, stores it in `data/messages.json`, and returns TwiML.
- `GET /api/sms`: returns stored messages for the dashboard refresh button.
- `POST /api/call`: receives inbound calls, stores them in `data/calls.json`, and forwards to `MY_REAL_PHONE`.
- `GET /api/call`: returns stored calls for the dashboard refresh button.
- `POST /api/send`: sends outbound SMS with the Twilio SDK and stores the sent message locally.

## Security Notes

Twilio credentials are only used in server-side code. In production, webhook requests are validated with `twilio.validateRequest()` using the `X-Twilio-Signature` header.

This app intentionally has no auth because it is meant for personal local use. Do not expose it publicly beyond short-lived webhook testing unless you add authentication.

## Twilio Account Notes

The inspected Twilio account is a trial account and the active number shows an A2P 10DLC registration notice for US messaging. Inbound messages and local testing can still be wired to the webhook, but outbound SMS to US recipients may be restricted until registration or trial verification requirements are satisfied.
