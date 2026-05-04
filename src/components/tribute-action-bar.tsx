"use client";

import { useState } from "react";

type ActionKey = "share" | "message" | "support";

type TributeAction = {
  key: ActionKey;
  label: string;
  targetId: string;
};

const actions: TributeAction[] = [
  { key: "share", label: "Share Tribute", targetId: "tribute-top" },
  { key: "message", label: "Leave a Message", targetId: "messages-section" },
  { key: "support", label: "Support Family", targetId: "support-section" },
];

export function TributeActionBar() {
  const [selectedAction, setSelectedAction] = useState<ActionKey | null>(null);

  function handleActionClick(action: TributeAction) {
    setSelectedAction(action.key);

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
    </section>
  );
}
