"use client";

import { useEffect, useMemo, useState } from "react";

type MessagePromptToastProps = {
  tributeSlug: string;
};

const PROMPT_DELAY_MS = 30_000;
const PROMPT_SNOOZE_MS = 24 * 60 * 60 * 1000;

function getSubmittedKey(slug: string) {
  return `biotribute-message-prompt-submitted-${slug}`;
}

function getDismissedKey(slug: string) {
  return `biotribute-message-prompt-dismissed-at-${slug}`;
}

function getShownKey(slug: string) {
  return `biotribute-message-prompt-shown-${slug}`;
}

export function MessagePromptToast({ tributeSlug }: MessagePromptToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const storageKeys = useMemo(
    () => ({
      submitted: getSubmittedKey(tributeSlug),
      dismissed: getDismissedKey(tributeSlug),
      shown: getShownKey(tributeSlug),
    }),
    [tributeSlug],
  );

  useEffect(() => {
    const submitted = window.localStorage.getItem(storageKeys.submitted) === "true";
    const shownThisSession = window.sessionStorage.getItem(storageKeys.shown) === "true";
    const dismissedAt = Number(window.localStorage.getItem(storageKeys.dismissed) ?? "0");
    const snoozed = Number.isFinite(dismissedAt) && Date.now() - dismissedAt < PROMPT_SNOOZE_MS;

    if (submitted || shownThisSession || snoozed) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.sessionStorage.setItem(storageKeys.shown, "true");
      setIsVisible(true);
    }, PROMPT_DELAY_MS);

    function handleSubmitted(event: Event) {
      const customEvent = event as CustomEvent<{ tributeSlug?: string }>;
      if (customEvent.detail?.tributeSlug !== tributeSlug) {
        return;
      }

      setIsVisible(false);
    }

    function handleOpenMessageForm() {
      setIsVisible(false);
    }

    window.addEventListener("biotribute:message-submitted", handleSubmitted);
    window.addEventListener("biotribute:open-message-form", handleOpenMessageForm);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("biotribute:message-submitted", handleSubmitted);
      window.removeEventListener("biotribute:open-message-form", handleOpenMessageForm);
    };
  }, [storageKeys, tributeSlug]);

  function dismissPrompt() {
    window.localStorage.setItem(storageKeys.dismissed, String(Date.now()));
    setIsVisible(false);
  }

  function openMessageForm() {
    window.dispatchEvent(new CustomEvent("biotribute:open-message-form"));
    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="message-prompt-toast" role="dialog" aria-live="polite" aria-label="Message prompt">
      <button
        className="message-prompt-close"
        type="button"
        aria-label="Maybe later"
        onClick={dismissPrompt}
      >
        ×
      </button>
      <p className="message-prompt-kicker">A Gentle Invitation</p>
      <h3>Would you like to leave a message for the family?</h3>
      <p>
        If you would like to share a condolence, memory, or short note of support, you can do that here.
      </p>
      <div className="message-prompt-actions">
        <button className="button-primary" type="button" onClick={openMessageForm}>
          Leave a Message
        </button>
        <button className="button-secondary" type="button" onClick={dismissPrompt}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
