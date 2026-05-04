"use client";

import { useEffect, useState } from "react";

type ActionKey = "share" | "message" | "support";

type TributeAction = {
  key: ActionKey;
  label: string;
  targetId?: string;
};

const actions: TributeAction[] = [
  { key: "share", label: "Share Tribute", targetId: "tribute-top" },
  { key: "message", label: "Leave a Message", targetId: "messages-section" },
  { key: "support", label: "Support Family", targetId: "support-section" },
];

function ActionIcon({ actionKey }: { actionKey: ActionKey }) {
  if (actionKey === "share") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M15 8a3 3 0 1 0-2.82-4H12a3 3 0 0 0 .18 1.02L8.91 6.96a3 3 0 0 0-1.91-.69 3 3 0 1 0 1.91 5.31l3.27 1.94A3 3 0 0 0 12 14a3 3 0 1 0 .18 4.98H12a3 3 0 0 0 2.82-4 2.98 2.98 0 0 0-.18-1.02l-3.27-1.94c.08-.32.13-.66.13-1.02s-.05-.7-.13-1.02l3.27-1.94c.32.12.66.18 1.02.18Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (actionKey === "message") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9l-4.29 3.22c-.66.5-1.6.03-1.6-.79V5.5Zm3.5 1a1 1 0 1 0 0 2h9a1 1 0 1 0 0-2h-9Zm0 4a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-6Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 21s-6.72-4.35-9.33-8.37C.93 9.92 1.8 6.3 4.85 4.66c2.01-1.08 4.47-.63 6.15 1.09 1.68-1.72 4.14-2.17 6.15-1.09 3.05 1.64 3.92 5.26 2.18 7.97C18.72 16.65 12 21 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TributeActionBar() {
  const [selectedAction, setSelectedAction] = useState<ActionKey | null>(null);
  const [shareStatus, setShareStatus] = useState<{ tone: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    if (!shareStatus) {
      return;
    }

    const timeout = window.setTimeout(() => setShareStatus(null), 2800);
    return () => window.clearTimeout(timeout);
  }, [shareStatus]);

  async function handleShareAction() {
    const shareUrl = `${window.location.origin}${window.location.pathname}`;
    const shareTitle = document.title || "Tribute";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: "Please view this tribute page.",
          url: shareUrl,
        });
        setShareStatus({ tone: "success", message: "Tribute link shared." });
        return;
      } catch {
        // Fallback to clipboard copy below.
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus({ tone: "success", message: "Tribute link copied." });
        return;
      } catch {
        // Final fallback below.
      }
    }

    try {
      const helperInput = document.createElement("input");
      helperInput.value = shareUrl;
      helperInput.style.position = "fixed";
      helperInput.style.opacity = "0";
      document.body.appendChild(helperInput);
      helperInput.focus();
      helperInput.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(helperInput);
      if (copied) {
        setShareStatus({ tone: "success", message: "Tribute link copied." });
        return;
      }
    } catch {
      // no-op
    }

    setShareStatus({ tone: "error", message: "Unable to share automatically." });
  }

  function handleActionClick(action: TributeAction) {
    setSelectedAction(action.key);

    if (action.key === "share") {
      void handleShareAction();
      return;
    }

    if (action.key === "message") {
      window.dispatchEvent(new CustomEvent("biotribute:open-message-form"));
      return;
    }

    if (!action.targetId) {
      return;
    }

    const section = document.getElementById(action.targetId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="action-bar">
      {actions.map((action) => {
        const isSelected = selectedAction === action.key;

        return (
          <button
            key={action.key}
            className={`tribute-action-pill ${isSelected ? "button-primary" : "button-secondary"}`}
            type="button"
            aria-pressed={isSelected}
            aria-controls={action.targetId}
            aria-label={action.label}
            title={action.label}
            onClick={() => handleActionClick(action)}
          >
            <ActionIcon actionKey={action.key} />
          </button>
        );
      })}
      {shareStatus ? (
        <p className={`action-bar-share-status ${shareStatus.tone === "error" ? "is-error" : ""}`}>
          {shareStatus.message}
        </p>
      ) : null}
    </section>
  );
}
