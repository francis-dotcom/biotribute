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
    const shareUrl = window.location.href;
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
            className={isSelected ? "button-primary" : "button-secondary"}
            type="button"
            aria-pressed={isSelected}
            aria-controls={action.targetId}
            onClick={() => handleActionClick(action)}
          >
            {action.label}
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
