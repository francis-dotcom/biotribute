/** Client-side hints when submitting before Turnstile returns a token. */
export const turnstileNotReadyYetMessage =
  "Bot verification is still completing. Give it a few seconds, then try Send again.";

export const turnstileSubmitWaitingLabel = "Waiting for verification…";

/** Green inline status while Turnstile is scoring (shows alongside widget + disabled Send). */
export const turnstileGreenWaitingNotice =
  "Verifying… Hang tight. Send unlocks after the checks succeed (a few seconds).";

/** Green inline status after Turnstile callback (before tapping Send); submit toast stays separate. */
export const turnstileGreenVerifiedNotice = "Verification succeeded—you can send.";
