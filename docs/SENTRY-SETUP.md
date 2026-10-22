# Sentry setup

Skillbuffet uses the official `@sentry/nextjs` SDK for browser, Node.js, Edge,
and Next.js request-error capture. Checkly remains the uptime monitor for the
plain `/api/health` endpoint.

## Privacy defaults

- Monitoring is disabled until an owner-created Sentry project supplies a DSN.
- `sendDefaultPii` is off, performance tracing is disabled, and session replay
  is not configured.
- Before an error leaves the app, the SDK hook removes request details, users,
  breadcrumbs, arbitrary contexts/tags, messages, and payload fields. Exception
  messages and source-context/local-variable fields are redacted; exception
  type and stack locations remain for diagnosis.
- Do not add request bodies, credentials, recipe contents, email addresses, or
  user IDs to Sentry manually.

## Owner setup after creating the Sentry project

1. Create a Sentry project for Next.js and copy its DSN.
2. Add `SENTRY_DSN` to the Vercel environments the owner approves. Add
   `NEXT_PUBLIC_SENTRY_DSN` only if browser-side errors should also be sent.
   The DSN identifies a project; it is not an authentication secret.
3. Redeploy the chosen environment and verify an intentional synthetic error
   appears without request, user, or payload data. Do not use real customer
   information for this check.
4. Configure alert recipients inside Sentry. Keep the existing Checkly uptime
   check unchanged.

No Sentry account, DSN, auth token, Vercel variable, or Sentry-side alert is
created or changed by this repository setup.
