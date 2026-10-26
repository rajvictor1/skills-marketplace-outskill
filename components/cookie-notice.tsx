"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const NOTICE_KEY = "skillbuffet-cookie-notice-v1";
const NOTICE_EVENT = "skillbuffet-cookie-notice-change";
let memoryAcknowledged = false;

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(NOTICE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(NOTICE_EVENT, onStoreChange);
  };
}

function getNoticeVisibility() {
  try {
    return window.localStorage.getItem(NOTICE_KEY) !== "acknowledged";
  } catch {
    return !memoryAcknowledged;
  }
}

export function CookieNotice() {
  const visible = useSyncExternalStore(subscribe, getNoticeVisibility, () => false);

  function acknowledge() {
    memoryAcknowledged = true;
    try {
      window.localStorage.setItem(NOTICE_KEY, "acknowledged");
    } catch {
      // Keep the notice usable when browser storage is unavailable.
    }
    window.dispatchEvent(new Event(NOTICE_EVENT));
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-5xl rounded-2xl border border-border bg-card/95 p-4 text-card-foreground shadow-[0_18px_60px_#0008] backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:flex sm:items-center sm:gap-6 sm:px-6 sm:py-5"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          <Cookie className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Cookie information</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            We use essential session cookies for sign-in and security. This beta
            has no advertising or third-party marketing analytics cookies. The
            notice and display theme are remembered in your browser storage.
          </p>
          <Link
            href="/privacy#cookies-and-browser-storage"
            className="mt-2 inline-flex text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
          >
            Read our privacy policy
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={acknowledge}
        className="brand-button mt-4 min-h-11 w-full shrink-0 rounded-xl px-5 text-sm sm:mt-0 sm:w-auto"
      >
        Accept cookies
      </button>
    </aside>
  );
}
