"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TributeGalleryItem } from "@/data/tributes";

type GalleryDashboardManagerProps = {
  slug: string;
  heroImageUrl?: string;
  backgroundImageUrl?: string;
  galleryImages: TributeGalleryItem[];
};

type UploadKind = "hero" | "background" | "gallery";

export function GalleryDashboardManager({
  slug,
  heroImageUrl,
  backgroundImageUrl,
  galleryImages,
}: GalleryDashboardManagerProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [pendingKind, setPendingKind] = useState<UploadKind | null>(null);
  const [heroImage, setHeroImage] = useState(heroImageUrl ?? "");
  const [backgroundImage, setBackgroundImage] = useState(backgroundImageUrl ?? "");
  const [gallery, setGallery] = useState<TributeGalleryItem[]>(galleryImages);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const heroInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(kind: UploadKind, files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setPendingKind(kind);
    setStatus(null);

    const formData = new FormData();
    formData.append("kind", kind);

    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    const response = await fetch(`/api/tributes/${slug}/images`, {
      method: "POST",
      body: formData,
    });

    const data = (await response.json()) as {
      error?: string;
      message?: string;
      uploads?: TributeGalleryItem[];
    };

    if (!response.ok) {
      setPendingKind(null);
      setStatus(data.error ?? "Unable to upload image.");
      return;
    }

    if (kind === "hero" && data.uploads?.[0]?.imageUrl) {
      setHeroImage(data.uploads[0].imageUrl);
      window.dispatchEvent(
        new CustomEvent("biotribute:hero-image-updated", {
          detail: { imageUrl: data.uploads[0].imageUrl },
        }),
      );
      router.refresh();
    }

    if (kind === "background" && data.uploads?.[0]?.imageUrl) {
      setBackgroundImage(data.uploads[0].imageUrl);
      window.dispatchEvent(
        new CustomEvent("biotribute:background-image-updated", {
          detail: { imageUrl: data.uploads[0].imageUrl },
        }),
      );
      router.refresh();
    }

    const uploadedItems = data.uploads ?? [];
    if (kind === "gallery" && uploadedItems.length > 0) {
      setGallery((current) => [...current, ...uploadedItems]);
    }

    setStatus(data.message ?? "Upload complete.");
    setPendingKind(null);
  }

  function previewClass(imageUrl?: string) {
    return imageUrl ? "dashboard-image-preview has-image" : "dashboard-image-preview";
  }

  async function deleteImage(kind: UploadKind, galleryId?: string) {
    setStatus(null);
    setPendingKind(kind);

    const response = await fetch(`/api/tributes/${slug}/images`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind,
        galleryId,
      }),
    });

    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      setStatus(data.error ?? "Unable to delete image.");
      setPendingKind(null);
      return;
    }

    if (kind === "hero") {
      setHeroImage("");
      window.dispatchEvent(
        new CustomEvent("biotribute:hero-image-updated", {
          detail: { imageUrl: "" },
        }),
      );
      router.refresh();
    }

    if (kind === "background") {
      setBackgroundImage("");
      window.dispatchEvent(
        new CustomEvent("biotribute:background-image-updated", {
          detail: { imageUrl: "" },
        }),
      );
      router.refresh();
    }

    if (kind === "gallery" && galleryId) {
      setGallery((current) => current.filter((item) => item.id !== galleryId));
    }

    setStatus(data.message ?? "Image deleted.");
    setPendingKind(null);
  }

  async function persistGalleryOrder(nextGallery: TributeGalleryItem[]) {
    const response = await fetch(`/api/tributes/${slug}/images`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        galleryIds: nextGallery.map((image) => image.id),
      }),
    });

    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      throw new Error(data.error ?? "Unable to reorder gallery.");
    }

    setStatus(data.message ?? "Gallery order updated.");
  }

  async function moveGalleryImage(dragId: string, targetId: string) {
    if (dragId === targetId) {
      return;
    }

    const previous = gallery;
    const fromIndex = previous.findIndex((item) => item.id === dragId);
    const toIndex = previous.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const next = [...previous];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setGallery(next);

    try {
      await persistGalleryOrder(next);
    } catch (error) {
      setGallery(previous);
      setStatus(error instanceof Error ? error.message : "Unable to reorder gallery.");
    }
  }

  return (
    <section className="dashboard-section">
      <article className="form-card dashboard-section-header">
        <p className="card-label">Images</p>
        <h2>Upload tribute media</h2>
        <p className="subtle-note">
          Upload the main portrait, a soft background image, and memory gallery photos.
          These files are stored in Supabase Storage and reflected on the public tribute.
        </p>
        {status ? <p className="form-status">{status}</p> : null}
      </article>

      <div className="dashboard-image-grid">
        <article className="form-card">
          <p className="card-label">Main Portrait</p>
          <h3>Hero image</h3>
          <div className={previewClass(heroImage)}>
            {heroImage ? <img src={heroImage} alt="" /> : null}
          </div>
          <label className="field-block">
            <span>Upload new hero image</span>
            <input
              ref={heroInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(event) => {
                void uploadFiles("hero", event.currentTarget.files);
              }}
            />
          </label>
          <p className="subtle-note">
            {pendingKind === "hero" ? "Uploading hero image..." : "One portrait image only."}
          </p>
          {heroImage ? (
            <button
              className="button-secondary dashboard-danger-button"
              type="button"
              disabled={pendingKind === "hero"}
              onClick={() => {
                void deleteImage("hero");
              }}
            >
              Delete Hero Image
            </button>
          ) : null}
        </article>

        <article className="form-card">
          <p className="card-label">Soft Background</p>
          <h3>Page and modal backdrop</h3>
          <div className={previewClass(backgroundImage)}>
            {backgroundImage ? <img src={backgroundImage} alt="" /> : null}
          </div>
          <label className="field-block">
            <span>Upload new background image</span>
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              onChange={(event) => {
                void uploadFiles("background", event.currentTarget.files);
              }}
            />
          </label>
          <p className="subtle-note">
            {pendingKind === "background"
              ? "Uploading background image..."
              : "Use a softer image than the portrait if you want a lighter memorial backdrop."}
          </p>
          {backgroundImage ? (
            <button
              className="button-secondary dashboard-danger-button"
              type="button"
              disabled={pendingKind === "background"}
              onClick={() => {
                void deleteImage("background");
              }}
            >
              Delete Background Image
            </button>
          ) : null}
        </article>
      </div>

      <article className="form-card">
        <p className="card-label">Gallery Uploads</p>
        <h3>Photo memory gallery</h3>
        <label className="field-block">
          <span>Upload gallery images</span>
          <input
            ref={galleryInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={(event) => {
              void uploadFiles("gallery", event.currentTarget.files);
            }}
          />
        </label>
        <p className="subtle-note">
          {pendingKind === "gallery"
            ? "Uploading gallery images..."
            : "You can select multiple files at once."}
        </p>

        {gallery.length > 0 ? (
          <div className="dashboard-gallery-grid">
            {gallery.map((image) => (
              <div
                className={`dashboard-gallery-thumb${draggingId === image.id ? " is-dragging" : ""}`}
                key={image.id}
                draggable
                onDragStart={() => setDraggingId(image.id)}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  const dragId = draggingId;
                  setDraggingId(null);
                  if (dragId) {
                    void moveGalleryImage(dragId, image.id);
                  }
                }}
              >
                <img src={image.imageUrl} alt="" />
                <div className="dashboard-gallery-thumb-actions">
                  <span className="dashboard-icon-chip dashboard-drag-chip" title="Drag to reorder">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="8" cy="6" r="1.6" />
                      <circle cx="8" cy="12" r="1.6" />
                      <circle cx="8" cy="18" r="1.6" />
                      <circle cx="16" cy="6" r="1.6" />
                      <circle cx="16" cy="12" r="1.6" />
                      <circle cx="16" cy="18" r="1.6" />
                    </svg>
                  </span>
                  <button
                    className="dashboard-icon-chip dashboard-delete-chip"
                    type="button"
                    aria-label="Delete image"
                    title="Delete image"
                    onClick={() => {
                      void deleteImage("gallery", image.id);
                    }}
                    disabled={pendingKind === "gallery"}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 3h6l1 2h4v2H4V5h4l1-2z" />
                      <path d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z" />
                      <path d="M10 10h2v8h-2zm4 0h2v8h-2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="dashboard-info-banner">
            No gallery images uploaded yet. Upload a few and they will start scrolling on
            the public tribute page.
          </div>
        )}
      </article>
    </section>
  );
}
