"use client";

type ShareTributeIconButtonProps = {
  className?: string;
};

export function ShareTributeIconButton({ className }: ShareTributeIconButtonProps) {
  async function handleShareClick() {
    const shareUrl = `${window.location.origin}${window.location.pathname}`;
    const shareTitle = document.title || "Tribute";

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: "Please view this tribute page.",
          url: shareUrl,
        });
        return;
      } catch {
        // Fall back to clipboard copy below.
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch {
        // Keep silent if sharing is blocked.
      }
    }
  }

  return (
    <button
      className={className ?? ""}
      type="button"
      aria-label="Share tribute"
      title="Share tribute"
      onClick={() => {
        void handleShareClick();
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="18" cy="5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="6" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="18" cy="19" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8.3 10.9l7.3-4.1M8.3 13.1l7.3 4.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
