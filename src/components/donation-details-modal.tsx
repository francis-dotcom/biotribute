"use client";

import { useEffect, useState } from "react";
import { MarkdownInline } from "@/components/markdown-text";

type DonationDetailsModalProps = {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  phone?: string;
  triggerClassName?: string;
  triggerLabel?: string;
};

export function DonationDetailsModal({
  accountName,
  accountNumber,
  bankName,
  phone,
  triggerClassName,
  triggerLabel,
}: DonationDetailsModalProps) {
  const [open, setOpen] = useState(false);
  const hasDetails = Boolean(accountName || accountNumber || bankName || phone);

  useEffect(() => {
    function openDonationModal() {
      setOpen(true);
    }

    window.addEventListener("biotribute:open-donation-modal", openDonationModal);
    return () => window.removeEventListener("biotribute:open-donation-modal", openDonationModal);
  }, []);

  return (
    <>
      <button
        className={triggerClassName ?? "support-action-pill support-action-pill-accent"}
        type="button"
        onClick={() => setOpen(true)}
      >
        {triggerLabel ?? "Donate"}
      </button>

      {open ? (
        <div className="message-modal-overlay" onClick={() => setOpen(false)}>
          <div
            className="message-modal-card form-modal-card donation-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">Family Support</p>
                <h3>Donation Details</h3>
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close donation details"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="form-modal-body">
              {hasDetails ? (
                <>
                  <div className="donation-detail-list">
                    {accountName ? (
                      <div className="donation-detail-row">
                        <span>Account Name</span>
                        <strong>
                          <MarkdownInline content={accountName} />
                        </strong>
                      </div>
                    ) : null}
                    {accountNumber ? (
                      <div className="donation-detail-row">
                        <span>Account Number</span>
                        <strong>
                          <MarkdownInline content={accountNumber} />
                        </strong>
                      </div>
                    ) : null}
                    {bankName ? (
                      <div className="donation-detail-row">
                        <span>Bank</span>
                        <strong>
                          <MarkdownInline content={bankName} />
                        </strong>
                      </div>
                    ) : null}
                    {phone ? (
                      <div className="donation-detail-row">
                        <span className="donation-contact-note">
                          Text donation details to this number and it will be acknowledged.
                        </span>
                        <strong>
                          <MarkdownInline content={phone} />
                        </strong>
                      </div>
                    ) : null}
                  </div>
                  <p className="donation-gratitude">Thank you as you give.</p>
                </>
              ) : (
                <p className="subtle-note">
                  Donation details have not been configured yet. Please contact the family representative directly for support instructions.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
