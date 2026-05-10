/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { MarkdownText } from "@/components/markdown-text";
import type { TributeRecord } from "@/data/tributes";

type TributeGallerySectionProps = {
  galleryIntro?: string;
  galleryImages: TributeRecord["galleryImages"];
  galleryNote: string;
};

type DragState = {
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
};

export function TributeGallerySection({
  galleryIntro,
  galleryImages,
  galleryNote,
}: TributeGallerySectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isStripInteracting, setIsStripInteracting] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const activeImage = activeIndex === null ? null : galleryImages[activeIndex] ?? null;
  const activeImageNumber = activeIndex === null ? 0 : activeIndex + 1;

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) => {
          if (current === null || galleryImages.length === 0) {
            return current;
          }

          return current === 0 ? galleryImages.length - 1 : current - 1;
        });
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((current) => {
          if (current === null || galleryImages.length === 0) {
            return current;
          }

          return current === galleryImages.length - 1 ? 0 : current + 1;
        });
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, galleryImages.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTo({ left: 0, top: 0 });
    dragStateRef.current = null;
  }, [activeIndex]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || galleryImages.length < 2 || isStripInteracting || activeIndex !== null) {
      return;
    }

    let frameId = 0;
    let previousTimestamp = 0;
    const pixelsPerSecond = 28;

    const step = (timestamp: number) => {
      if (!strip.isConnected) {
        return;
      }

      if (previousTimestamp === 0) {
        previousTimestamp = timestamp;
      }

      const elapsed = timestamp - previousTimestamp;
      previousTimestamp = timestamp;
      const halfWidth = strip.scrollWidth / 2;

      strip.scrollLeft += (pixelsPerSecond * elapsed) / 1000;
      if (strip.scrollLeft >= halfWidth) {
        strip.scrollLeft -= halfWidth;
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [galleryImages.length, isStripInteracting, activeIndex]);

  function showPreviousImage() {
    setActiveIndex((current) => {
      if (current === null || galleryImages.length === 0) {
        return current;
      }

      return current === 0 ? galleryImages.length - 1 : current - 1;
    });
  }

  function showNextImage() {
    setActiveIndex((current) => {
      if (current === null || galleryImages.length === 0) {
        return current;
      }

      return current === galleryImages.length - 1 ? 0 : current + 1;
    });
  }

  function scrollGallery(direction: "left" | "right") {
    const strip = stripRef.current;
    if (!strip) {
      return;
    }

    const amount = Math.max(260, strip.clientWidth * 0.8);
    strip.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    viewport.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    const dragState = dragStateRef.current;

    if (!viewport || !dragState) {
      return;
    }

    viewport.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.startX);
    viewport.scrollTop = dragState.scrollTop - (event.clientY - dragState.startY);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const canScrollHorizontally = viewport.scrollWidth > viewport.clientWidth;
    const canScrollVertically = viewport.scrollHeight > viewport.clientHeight;

    if (!canScrollHorizontally && !canScrollVertically) {
      return;
    }

    if (
      canScrollHorizontally &&
      !canScrollVertically &&
      Math.abs(event.deltaY) > Math.abs(event.deltaX)
    ) {
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    }
  }

  return (
    <>
      <section className="content-section content-section-soft">
        <p className="section-kicker">Photo Gallery</p>
        <h2>Moments in Memory</h2>
        <span className="section-accent" />
        <div className="gallery-card gallery-card-full">
          <p>{galleryIntro?.trim()}</p>
          {galleryImages.length > 0 ? (
            <>
              <div className="messages-scroll-actions tribute-gallery-scroll-actions" role="group" aria-label="Scroll gallery images">
                <button
                  className="messages-scroll-button"
                  type="button"
                  aria-label="Scroll gallery left"
                  onClick={() => scrollGallery("left")}
                >
                  ←
                </button>
                <button
                  className="messages-scroll-button"
                  type="button"
                  aria-label="Scroll gallery right"
                  onClick={() => scrollGallery("right")}
                >
                  →
                </button>
              </div>
              <div
                className="messages-stream tribute-gallery-stream"
                ref={stripRef}
                onMouseEnter={() => setIsStripInteracting(true)}
                onMouseLeave={() => setIsStripInteracting(false)}
                onTouchStart={() => setIsStripInteracting(true)}
                onTouchEnd={() => setIsStripInteracting(false)}
                onTouchCancel={() => setIsStripInteracting(false)}
              >
                <div
                  className="messages-track tribute-gallery-track"
                  role="list"
                  aria-label="Photo gallery"
                >
                  {[...galleryImages, ...galleryImages].map((image, index) => (
                    <button
                      key={`${image.id}-${index}`}
                      className="tribute-gallery-button tribute-gallery-strip-button"
                      type="button"
                      role="listitem"
                      aria-label={`Open gallery image ${(index % galleryImages.length) + 1} of ${galleryImages.length}`}
                      onClick={() => setActiveIndex(index % galleryImages.length)}
                    >
                      <span
                        className="gallery-item has-image tribute-gallery-strip-item"
                        style={{ backgroundImage: `url("${image.imageUrl}")` }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="gallery-stream" aria-hidden="true">
                <div className="gallery-track">
                  <div className="gallery-item" />
                  <div className="gallery-item" />
                  <div className="gallery-item" />
                  <div className="gallery-item" />
                  <div className="gallery-item" />
                  <div className="gallery-item" />
                  <div className="gallery-item" />
                  <div className="gallery-item" />
                </div>
              </div>
              <MarkdownText content={galleryNote} className="subtle-note" />
            </>
          )}
        </div>
      </section>

      {activeImage ? (
        <div
          className="message-modal-overlay tribute-gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image viewer"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="message-modal-card tribute-gallery-lightbox-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">Moments in Memory</p>
                <h3>{`Image ${activeImageNumber} of ${galleryImages.length}`}</h3>
              </div>
              <button
                className="message-modal-close"
                type="button"
                aria-label="Close gallery image viewer"
                onClick={() => setActiveIndex(null)}
              >
                Close
              </button>
            </div>

            <div className="tribute-gallery-lightbox-body">
              {galleryImages.length > 1 ? (
                <button
                  className="tribute-gallery-arrow tribute-gallery-arrow-left"
                  type="button"
                  aria-label="Show previous image"
                  onClick={showPreviousImage}
                >
                  ‹
                </button>
              ) : null}

              <div
                ref={viewportRef}
                className="tribute-gallery-viewport"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onWheel={handleWheel}
              >
                <img
                  className="tribute-gallery-full-image"
                  src={activeImage.imageUrl}
                  alt={`Gallery memory ${activeImageNumber}`}
                  draggable={false}
                />
              </div>

              {galleryImages.length > 1 ? (
                <button
                  className="tribute-gallery-arrow tribute-gallery-arrow-right"
                  type="button"
                  aria-label="Show next image"
                  onClick={showNextImage}
                >
                  ›
                </button>
              ) : null}
            </div>

            <p className="subtle-note tribute-gallery-lightbox-note">
              Use the arrows or your keyboard to move between images. Drag or scroll to pan larger
              photos.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
