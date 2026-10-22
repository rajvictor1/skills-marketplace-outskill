type SentryExceptionValue = {
  value?: string | null;
  stacktrace?: {
    frames?: Array<Record<string, unknown>> | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

export type SentryEventForScrubbing = {
  request?: unknown;
  user?: unknown;
  extra?: unknown;
  breadcrumbs?: unknown;
  contexts?: unknown;
  tags?: unknown;
  message?: unknown;
  logentry?: unknown;
  transaction?: unknown;
  culprit?: unknown;
  debug_meta?: unknown;
  sdkProcessingMetadata?: unknown;
  exception?: { values?: SentryExceptionValue[] | null } | null;
  [key: string]: unknown;
};

/** Keep error type and stack location while dropping request, user, and payload data. */
export function scrubSentryEvent<T extends object>(rawEvent: T): T {
  const event = rawEvent as T & SentryEventForScrubbing;
  for (const key of [
    "request",
    "user",
    "extra",
    "breadcrumbs",
    "contexts",
    "tags",
    "message",
    "logentry",
    "transaction",
    "culprit",
    "debug_meta",
    "sdkProcessingMetadata",
  ]) {
    delete event[key];
  }

  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((value) => ({
      ...value,
      value: "[redacted]",
      ...(value.stacktrace
        ? {
            stacktrace: {
              ...value.stacktrace,
              frames: value.stacktrace.frames?.map((frame) =>
                Object.fromEntries(
                  Object.entries(frame).filter(
                    ([key]) =>
                      ![
                        "vars",
                        "pre_context",
                        "context_line",
                        "post_context",
                      ].includes(key),
                  ),
                ),
              ),
            },
          }
        : {}),
    }));
  }

  return event;
}
