// /* eslint-disable @next/next/no-img-element */
// "use client";

// import { useEffect, useLayoutEffect, useRef, useState } from "react";
// import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
// import { MarkdownText } from "@/components/markdown-text";
// import type { TributeRecord } from "@/data/tributes";

// type TributeGallerySectionProps = {
//   galleryIntro?: string;
//   galleryImages: TributeRecord["galleryImages"];
//   galleryNote: string;
// };

// type DragState = {
//   startX: number;
//   startY: number;
//   scrollLeft: number;
//   scrollTop: number;
// };

// type StripDragState = {
//   pointerId: number;
//   startX: number;
//   scrollLeft: number;
//   captureActive: boolean;
//   moved: boolean;
// };

// /** Narrow layout hides strip arrow buttons — strip still relies on horizontal overflow + touch scrolling on phones. */
// function useMobileGalleryStripNativeScroll() {
//   const [preferNativeTouch, setPreferNativeTouch] = useState(false);

//   useLayoutEffect(() => {
//     const mq = window.matchMedia("(max-width: 640px)");
//     function apply() {
//       setPreferNativeTouch(mq.matches);
//     }
//     apply();
//     mq.addEventListener("change", apply);
//     return () => mq.removeEventListener("change", apply);
//   }, []);

//   return preferNativeTouch;
// }

// /** iPhone / iPad (WKWebKit): prefer native horizontal pan + momentum; custom pointer-drag for the strip is redundant and can feel wrong on touch. */
// function useIosLikelyGalleryStripPreferNativeGestures() {
//   const [prefer, setPrefer] = useState(false);

//   useLayoutEffect(() => {
//     if (typeof navigator === "undefined") {
//       return;
//     }
//     const ua = navigator.userAgent;
//     const isIosLikely =
//       /iPhone|iPod/i.test(ua) ||
//       /iPad/i.test(ua) ||
//       (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
//     setPrefer(isIosLikely);
//   }, []);

//   return prefer;
// }

// export function TributeGallerySection({
//   galleryIntro,
//   galleryImages,
//   galleryNote,
// }: TributeGallerySectionProps) {
//   const stripPreferNativeTouch = useMobileGalleryStripNativeScroll();
//   const stripPreferIosNativeGestures = useIosLikelyGalleryStripPreferNativeGestures();
//   /** iOS WKWebKit (all widths): use browser scroll physics for drags; RAF autoscroll pauses on user scroll via `programmaticStripScrollRef`. */
//   const stripUsesNativeGesturesOnly = stripPreferNativeTouch || stripPreferIosNativeGestures;
//   const [activeIndex, setActiveIndex] = useState<number | null>(null);
//   const stripRef = useRef<HTMLDivElement | null>(null);
//   const viewportRef = useRef<HTMLDivElement | null>(null);
//   const dragStateRef = useRef<DragState | null>(null);
//   const stripDragStateRef = useRef<StripDragState | null>(null);
//   const stripResumeTimeoutRef = useRef<number | null>(null);
//   const programmaticStripScrollResetFrameRef = useRef<number | null>(null);
//   const autoScrollPausedRef = useRef(false);
//   const programmaticStripScrollRef = useRef(false);
//   const suppressStripClickRef = useRef(false);

//   const activeImage = activeIndex === null ? null : galleryImages[activeIndex] ?? null;
//   const activeImageNumber = activeIndex === null ? 0 : activeIndex + 1;

//   function closeActiveImage() {
//     autoScrollPausedRef.current = false;
//     setActiveIndex(null);
//   }

//   useEffect(() => {
//     if (activeIndex === null) {
//       return;
//     }

//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key === "Escape") {
//         closeActiveImage();
//         return;
//       }

//       if (event.key === "ArrowLeft") {
//         event.preventDefault();
//         setActiveIndex((current) => {
//           if (current === null || galleryImages.length === 0) {
//             return current;
//           }

//           return current === 0 ? galleryImages.length - 1 : current - 1;
//         });
//       }

//       if (event.key === "ArrowRight") {
//         event.preventDefault();
//         setActiveIndex((current) => {
//           if (current === null || galleryImages.length === 0) {
//             return current;
//           }

//           return current === galleryImages.length - 1 ? 0 : current + 1;
//         });
//       }
//     };

//     const previousOverflow = document.body.style.overflow;
//     document.body.style.overflow = "hidden";
//     window.addEventListener("keydown", handleKeyDown);

//     return () => {
//       document.body.style.overflow = previousOverflow;
//       window.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [activeIndex, galleryImages.length]);

//   useEffect(() => {
//     const viewport = viewportRef.current;
//     if (!viewport) {
//       return;
//     }

//     viewport.scrollTo({ left: 0, top: 0 });
//     dragStateRef.current = null;
//   }, [activeIndex]);

//   useEffect(() => {
//     return () => {
//       if (stripResumeTimeoutRef.current !== null) {
//         window.clearTimeout(stripResumeTimeoutRef.current);
//       }
//       if (programmaticStripScrollResetFrameRef.current !== null) {
//         window.cancelAnimationFrame(programmaticStripScrollResetFrameRef.current);
//       }
//     };
//   }, []);

//   useEffect(() => {
//     const strip = stripRef.current;
//     if (!strip || galleryImages.length < 2 || activeIndex !== null) {
//       return;
//     }

//     autoScrollPausedRef.current = false;
//     const shouldTrackScrollEvents = !stripUsesNativeGesturesOnly;

//     function onUserScroll() {
//       if (programmaticStripScrollRef.current) {
//         return;
//       }

//       pauseStripAutoScrollNow();
//       resumeStripAutoScroll(2000);
//     }

//     if (shouldTrackScrollEvents) {
//       strip.addEventListener("scroll", onUserScroll, { passive: true });
//     }

//     let frameId = 0;
//     let previousTimestamp = 0;
//     const pixelsPerSecond = 28;

//     const step = (timestamp: number) => {
//       if (!strip.isConnected) {
//         return;
//       }

//       if (previousTimestamp === 0) {
//         previousTimestamp = timestamp;
//       }

//       const elapsed = timestamp - previousTimestamp;
//       previousTimestamp = timestamp;

//       if (!autoScrollPausedRef.current) {
//         const halfWidth = strip.scrollWidth / 2;
//         programmaticStripScrollRef.current = true;
//         strip.scrollLeft += (pixelsPerSecond * elapsed) / 1000;
//         if (strip.scrollLeft >= halfWidth) {
//           strip.scrollLeft -= halfWidth;
//         }
//         if (programmaticStripScrollResetFrameRef.current !== null) {
//           window.cancelAnimationFrame(programmaticStripScrollResetFrameRef.current);
//         }
//         programmaticStripScrollResetFrameRef.current = window.requestAnimationFrame(() => {
//           programmaticStripScrollRef.current = false;
//           programmaticStripScrollResetFrameRef.current = null;
//         });
//       }

//       frameId = window.requestAnimationFrame(step);
//     };

//     frameId = window.requestAnimationFrame(step);

//     return () => {
//       if (shouldTrackScrollEvents) {
//         strip.removeEventListener("scroll", onUserScroll);
//       }
//       window.cancelAnimationFrame(frameId);
//       if (programmaticStripScrollResetFrameRef.current !== null) {
//         window.cancelAnimationFrame(programmaticStripScrollResetFrameRef.current);
//         programmaticStripScrollResetFrameRef.current = null;
//       }
//       programmaticStripScrollRef.current = false;
//     };
//   }, [galleryImages.length, activeIndex, stripUsesNativeGesturesOnly]);

//   function showPreviousImage() {
//     setActiveIndex((current) => {
//       if (current === null || galleryImages.length === 0) {
//         return current;
//       }

//       return current === 0 ? galleryImages.length - 1 : current - 1;
//     });
//   }

//   function showNextImage() {
//     setActiveIndex((current) => {
//       if (current === null || galleryImages.length === 0) {
//         return current;
//       }

//       return current === galleryImages.length - 1 ? 0 : current + 1;
//     });
//   }

//   function scrollGallery(direction: "left" | "right") {
//     const strip = stripRef.current;
//     if (!strip) {
//       return;
//     }

//     pauseStripAutoScrollNow();
//     const amount = Math.max(260, strip.clientWidth * 0.8);
//     strip.scrollTo({
//       left: strip.scrollLeft + (direction === "right" ? amount : -amount),
//       behavior: "smooth",
//     });

//     resumeStripAutoScroll(1400);
//   }

//   function resumeStripAutoScroll(delayMs = 900) {
//     if (stripResumeTimeoutRef.current !== null) {
//       window.clearTimeout(stripResumeTimeoutRef.current);
//     }

//     stripResumeTimeoutRef.current = window.setTimeout(() => {
//       autoScrollPausedRef.current = false;
//       stripResumeTimeoutRef.current = null;
//     }, delayMs);
//   }

//   /** Pause RAF auto-scroll immediately and cancel any pending resume (e.g. touch / drag start). */
//   function pauseStripAutoScrollNow() {
//     autoScrollPausedRef.current = true;
//     if (stripResumeTimeoutRef.current !== null) {
//       window.clearTimeout(stripResumeTimeoutRef.current);
//       stripResumeTimeoutRef.current = null;
//     }
//   }

//   function handleStripPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
//     if (stripPreferNativeTouch) {
//       return;
//     }
//     const strip = stripRef.current;
//     if (!strip) {
//       return;
//     }

//     pauseStripAutoScrollNow();
//     suppressStripClickRef.current = false;
//     /** Defer capture until the user exceeds a horizontal drag threshold so taps on thumbnails still synthesize clicks. */
//     stripDragStateRef.current = {
//       pointerId: event.pointerId,
//       startX: event.clientX,
//       scrollLeft: strip.scrollLeft,
//       captureActive: false,
//       moved: false,
//     };
//   }

//   function handleStripPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
//     if (stripPreferNativeTouch) {
//       return;
//     }
//     const strip = stripRef.current;
//     const dragState = stripDragStateRef.current;
//     if (!strip || !dragState) {
//       return;
//     }

//     const deltaX = event.clientX - dragState.startX;
//     const activateDragPx = 10;

//     if (!dragState.captureActive) {
//       if (Math.abs(deltaX) < activateDragPx) {
//         return;
//       }

//       dragState.captureActive = true;
//       strip.setPointerCapture(dragState.pointerId);
//     }

//     strip.scrollLeft = dragState.scrollLeft - deltaX;

//     dragState.moved = true;
//     suppressStripClickRef.current = true;
//   }

//   function handleStripPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
//     if (stripPreferNativeTouch) {
//       return;
//     }
//     const strip = stripRef.current;
//     const dragState = stripDragStateRef.current;

//     if (strip?.hasPointerCapture(event.pointerId)) {
//       strip.releasePointerCapture(event.pointerId);
//     }

//     stripDragStateRef.current = null;
//     resumeStripAutoScroll();

//     if (!dragState?.moved) {
//       suppressStripClickRef.current = false;
//       return;
//     }

//     window.setTimeout(() => {
//       suppressStripClickRef.current = false;
//     }, 0);
//   }

//   function handleStripMouseEnterPause() {
//     if (stripPreferNativeTouch) {
//       return;
//     }
//     pauseStripAutoScrollNow();
//   }

//   function handleStripMouseLeaveResume() {
//     if (stripPreferNativeTouch) {
//       return;
//     }
//     autoScrollPausedRef.current = false;
//   }

//   function handleStripTouchInterrupt() {
//     if (stripPreferNativeTouch) {
//       return;
//     }
//     resumeStripAutoScroll(600);
//   }

//   function handleStripTouchPause() {
//     if (stripPreferNativeTouch) {
//       return;
//     }
//     pauseStripAutoScrollNow();
//   }

//   function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
//     const viewport = viewportRef.current;
//     if (!viewport) {
//       return;
//     }

//     dragStateRef.current = {
//       startX: event.clientX,
//       startY: event.clientY,
//       scrollLeft: viewport.scrollLeft,
//       scrollTop: viewport.scrollTop,
//     };
//     viewport.setPointerCapture(event.pointerId);
//   }

//   function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
//     const viewport = viewportRef.current;
//     const dragState = dragStateRef.current;

//     if (!viewport || !dragState) {
//       return;
//     }

//     viewport.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.startX);
//     viewport.scrollTop = dragState.scrollTop - (event.clientY - dragState.startY);
//   }

//   function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
//     const viewport = viewportRef.current;
//     if (viewport?.hasPointerCapture(event.pointerId)) {
//       viewport.releasePointerCapture(event.pointerId);
//     }

//     dragStateRef.current = null;
//   }

//   function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
//     const viewport = viewportRef.current;
//     if (!viewport) {
//       return;
//     }

//     const canScrollHorizontally = viewport.scrollWidth > viewport.clientWidth;
//     const canScrollVertically = viewport.scrollHeight > viewport.clientHeight;

//     if (!canScrollHorizontally && !canScrollVertically) {
//       return;
//     }

//     if (
//       canScrollHorizontally &&
//       !canScrollVertically &&
//       Math.abs(event.deltaY) > Math.abs(event.deltaX)
//     ) {
//       event.preventDefault();
//       viewport.scrollLeft += event.deltaY;
//     }
//   }

//   const stripSyntheticHandlers = stripUsesNativeGesturesOnly
//     ? {}
//     : {
//         onPointerDown: handleStripPointerDown,
//         onPointerMove: handleStripPointerMove,
//         onPointerUp: handleStripPointerUp,
//         onPointerCancel: handleStripPointerUp,
//         onMouseEnter: handleStripMouseEnterPause,
//         onMouseLeave: handleStripMouseLeaveResume,
//         onTouchStart: handleStripTouchPause,
//         onTouchEnd: handleStripTouchInterrupt,
//         onTouchCancel: handleStripTouchInterrupt,
//       };

//   const stripSurfaceClass = "messages-stream tribute-gallery-stream";
//   const trackSurfaceClass = "messages-track tribute-gallery-track";

//   return (
//     <>
//       <section className="content-section content-section-soft">
//         <p className="section-kicker">Photo Gallery</p>
//         <h2>Moments in Memory</h2>
//         <span className="section-accent" />
//         <div className="gallery-card gallery-card-full">
//           <p>{galleryIntro?.trim()}</p>
//           {galleryImages.length > 0 ? (
//             <>
//               <div className="messages-scroll-actions tribute-gallery-scroll-actions" role="group" aria-label="Scroll gallery images">
//                 <button
//                   className="messages-scroll-button"
//                   type="button"
//                   aria-label="Scroll gallery left"
//                   onClick={() => scrollGallery("left")}
//                 >
//                   ←
//                 </button>
//                 <button
//                   className="messages-scroll-button"
//                   type="button"
//                   aria-label="Scroll gallery right"
//                   onClick={() => scrollGallery("right")}
//                 >
//                   →
//                 </button>
//               </div>
//               <div
//                 className={stripSurfaceClass}
//                 ref={stripRef}
//                 {...stripSyntheticHandlers}
//               >
//                 <div
//                   className={trackSurfaceClass}
//                   role="list"
//                   aria-label="Photo gallery"
//                 >
//                   {[...galleryImages, ...galleryImages].map((image, index) => (
//                     <button
//                       key={`${image.id}-${index}`}
//                       className="tribute-gallery-button tribute-gallery-strip-button"
//                       type="button"
//                       role="listitem"
//                       aria-label={`Open gallery image ${(index % galleryImages.length) + 1} of ${galleryImages.length}`}
//                       onClick={() => {
//                         if (!stripUsesNativeGesturesOnly && suppressStripClickRef.current) {
//                           return;
//                         }

//                         setActiveIndex(index % galleryImages.length);
//                       }}
//                     >
//                       <img
//                         className="gallery-item tribute-gallery-strip-item tribute-gallery-strip-image"
//                         src={image.imageUrl}
//                         alt={`Gallery memory ${(index % galleryImages.length) + 1}`}
//                         draggable={false}
//                         loading={index < galleryImages.length ? "eager" : "lazy"}
//                         decoding="async"
//                       />
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             </>
//           ) : (
//             <>
//               <div className="gallery-stream" aria-hidden="true">
//                 <div className="gallery-track">
//                   <div className="gallery-item" />
//                   <div className="gallery-item" />
//                   <div className="gallery-item" />
//                   <div className="gallery-item" />
//                   <div className="gallery-item" />
//                   <div className="gallery-item" />
//                   <div className="gallery-item" />
//                 </div>
//               </div>
//               <MarkdownText content={galleryNote} className="subtle-note" />
//             </>
//           )}
//         </div>
//       </section>

//       {activeImage ? (
//         <div
//           className="message-modal-overlay tribute-gallery-lightbox"
//           role="dialog"
//           aria-modal="true"
//           aria-label="Gallery image viewer"
//           onClick={closeActiveImage}
//         >
//           <div
//             className="message-modal-card tribute-gallery-lightbox-card"
//             onClick={(event) => event.stopPropagation()}
//           >
//             <div className="message-modal-head">
//               <div>
//                 <p className="message-modal-kicker">Moments in Memory</p>
//                 <h3>{`Image ${activeImageNumber} of ${galleryImages.length}`}</h3>
//               </div>
//               <button
//                 className="message-modal-close"
//                 type="button"
//                 aria-label="Close gallery image viewer"
//                 onClick={closeActiveImage}
//               >
//                 Close
//               </button>
//             </div>

//             <div className="tribute-gallery-lightbox-body">
//               {galleryImages.length > 1 ? (
//                 <button
//                   className="tribute-gallery-arrow tribute-gallery-arrow-left"
//                   type="button"
//                   aria-label="Show previous image"
//                   onClick={showPreviousImage}
//                 >
//                   ‹
//                 </button>
//               ) : null}

//               <div
//                 ref={viewportRef}
//                 className="tribute-gallery-viewport"
//                 onPointerDown={handlePointerDown}
//                 onPointerMove={handlePointerMove}
//                 onPointerUp={handlePointerUp}
//                 onPointerCancel={handlePointerUp}
//                 onWheel={handleWheel}
//               >
//                 <img
//                   className="tribute-gallery-full-image"
//                   src={activeImage.imageUrl}
//                   alt={`Gallery memory ${activeImageNumber}`}
//                   draggable={false}
//                 />
//               </div>

//               {galleryImages.length > 1 ? (
//                 <button
//                   className="tribute-gallery-arrow tribute-gallery-arrow-right"
//                   type="button"
//                   aria-label="Show next image"
//                   onClick={showNextImage}
//                 >
//                   ›
//                 </button>
//               ) : null}
//             </div>

//             <p className="subtle-note tribute-gallery-lightbox-note">
//               Use the arrows or your keyboard to move between images. Drag or scroll to pan larger
//               photos.
//             </p>
//           </div>
//         </div>
//       ) : null}
//     </>
//   );
// }



/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
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

type StripDragState = {
  pointerId: number;
  startX: number;
  scrollLeft: number;
  captureActive: boolean;
  moved: boolean;
};

/** Narrow layout hides strip arrow buttons — strip still relies on horizontal overflow + touch scrolling on phones. */
function useMobileGalleryStripNativeScroll() {
  const [preferNativeTouch, setPreferNativeTouch] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    function apply() {
      setPreferNativeTouch(mq.matches);
    }
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return preferNativeTouch;
}

export function TributeGallerySection({
  galleryIntro,
  galleryImages,
  galleryNote,
}: TributeGallerySectionProps) {
  const stripPreferNativeTouch = useMobileGalleryStripNativeScroll();

  // ✅ Auto-scroll now works on ALL devices (including iOS)
  const stripUsesNativeGesturesOnly = stripPreferNativeTouch;

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const stripDragStateRef = useRef<StripDragState | null>(null);
  const stripResumeTimeoutRef = useRef<number | null>(null);
  const autoScrollPausedRef = useRef(false);
  const suppressStripClickRef = useRef(false);

  const activeImage = activeIndex === null ? null : galleryImages[activeIndex] ?? null;
  const activeImageNumber = activeIndex === null ? 0 : activeIndex + 1;

  function closeActiveImage() {
    autoScrollPausedRef.current = false;
    setActiveIndex(null);
  }

  // Keyboard navigation
  useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeActiveImage();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) =>
          current === null || galleryImages.length === 0
            ? current
            : current === 0
            ? galleryImages.length - 1
            : current - 1
        );
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((current) =>
          current === null || galleryImages.length === 0
            ? current
            : current === galleryImages.length - 1
            ? 0
            : current + 1
        );
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

  // Reset viewport when opening lightbox
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ left: 0, top: 0 });
    dragStateRef.current = null;
  }, [activeIndex]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (stripResumeTimeoutRef.current !== null) {
        window.clearTimeout(stripResumeTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Improved Auto-scroll (works on iOS too)
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || galleryImages.length < 2 || activeIndex !== null) {
      return;
    }

    autoScrollPausedRef.current = false;

    let frameId: number;
    let lastTime = 0;
    const pixelsPerSecond = 28;

    const tick = (timestamp: number) => {
      if (!strip.isConnected) return;

      if (lastTime === 0) lastTime = timestamp;
      const elapsed = timestamp - lastTime;
      lastTime = timestamp;

      if (!autoScrollPausedRef.current) {
        const halfWidth = strip.scrollWidth / 2;
        strip.scrollLeft += (pixelsPerSecond * elapsed) / 1000;

        // Smoother seamless loop
        if (strip.scrollLeft >= halfWidth) {
          strip.scrollLeft = strip.scrollLeft % halfWidth;
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [galleryImages.length, activeIndex]);

  const pauseStripAutoScrollNow = useCallback(() => {
    autoScrollPausedRef.current = true;
    if (stripResumeTimeoutRef.current !== null) {
      window.clearTimeout(stripResumeTimeoutRef.current);
      stripResumeTimeoutRef.current = null;
    }
  }, []);

  const resumeStripAutoScroll = useCallback((delayMs = 900) => {
    if (stripResumeTimeoutRef.current !== null) {
      window.clearTimeout(stripResumeTimeoutRef.current);
    }
    stripResumeTimeoutRef.current = window.setTimeout(() => {
      autoScrollPausedRef.current = false;
      stripResumeTimeoutRef.current = null;
    }, delayMs);
  }, []);

  function scrollGallery(direction: "left" | "right") {
    const strip = stripRef.current;
    if (!strip) return;

    pauseStripAutoScrollNow();
    const amount = Math.max(260, strip.clientWidth * 0.8);
    strip.scrollTo({
      left: strip.scrollLeft + (direction === "right" ? amount : -amount),
      behavior: "smooth",
    });

    resumeStripAutoScroll(1400);
  }

  // ... (All your pointer handlers remain the same - only removed iOS blocking)

  function handleStripPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (stripPreferNativeTouch) return;
    const strip = stripRef.current;
    if (!strip) return;

    pauseStripAutoScrollNow();
    suppressStripClickRef.current = false;

    stripDragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: strip.scrollLeft,
      captureActive: false,
      moved: false,
    };
  }

  function handleStripPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (stripPreferNativeTouch) return;
    const strip = stripRef.current;
    const dragState = stripDragStateRef.current;
    if (!strip || !dragState) return;

    const deltaX = event.clientX - dragState.startX;
    const activateDragPx = 10;

    if (!dragState.captureActive) {
      if (Math.abs(deltaX) < activateDragPx) return;

      dragState.captureActive = true;
      strip.setPointerCapture(dragState.pointerId);
    }

    strip.scrollLeft = dragState.scrollLeft - deltaX;
    dragState.moved = true;
    suppressStripClickRef.current = true;
  }

  function handleStripPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (stripPreferNativeTouch) return;
    const strip = stripRef.current;
    const dragState = stripDragStateRef.current;

    if (strip?.hasPointerCapture(event.pointerId)) {
      strip.releasePointerCapture(event.pointerId);
    }

    stripDragStateRef.current = null;
    resumeStripAutoScroll();

    if (!dragState?.moved) {
      suppressStripClickRef.current = false;
      return;
    }

    window.setTimeout(() => {
      suppressStripClickRef.current = false;
    }, 0);
  }

  function handleStripMouseEnterPause() {
    if (stripPreferNativeTouch) return;
    pauseStripAutoScrollNow();
  }

  function handleStripMouseLeaveResume() {
    if (stripPreferNativeTouch) return;
    resumeStripAutoScroll(300);
  }

  function handleStripTouchInterrupt() {
    if (stripPreferNativeTouch) return;
    resumeStripAutoScroll(600);
  }

  function handleStripTouchPause() {
    if (stripPreferNativeTouch) return;
    pauseStripAutoScrollNow();
  }

  // Lightbox handlers (unchanged)
  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport) return;

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
    if (!viewport || !dragState) return;

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
    if (!viewport) return;

    const canScrollHorizontally = viewport.scrollWidth > viewport.clientWidth;
    const canScrollVertically = viewport.scrollHeight > viewport.clientHeight;

    if (!canScrollHorizontally && !canScrollVertically) return;

    if (canScrollHorizontally && !canScrollVertically && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    }
  }

  const stripSyntheticHandlers = stripUsesNativeGesturesOnly
    ? {}
    : {
        onPointerDown: handleStripPointerDown,
        onPointerMove: handleStripPointerMove,
        onPointerUp: handleStripPointerUp,
        onPointerCancel: handleStripPointerUp,
        onMouseEnter: handleStripMouseEnterPause,
        onMouseLeave: handleStripMouseLeaveResume,
        onTouchStart: handleStripTouchPause,
        onTouchEnd: handleStripTouchInterrupt,
        onTouchCancel: handleStripTouchInterrupt,
      };

  const stripSurfaceClass = "messages-stream tribute-gallery-stream";
  const trackSurfaceClass = "messages-track tribute-gallery-track";

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
                <button className="messages-scroll-button" type="button" aria-label="Scroll gallery left" onClick={() => scrollGallery("left")}>
                  ←
                </button>
                <button className="messages-scroll-button" type="button" aria-label="Scroll gallery right" onClick={() => scrollGallery("right")}>
                  →
                </button>
              </div>

              <div className={stripSurfaceClass} ref={stripRef} {...stripSyntheticHandlers}>
                <div className={trackSurfaceClass} role="list" aria-label="Photo gallery">
                  {[...galleryImages, ...galleryImages].map((image, index) => (
                    <button
                      key={`${image.id}-${index}`}
                      className="tribute-gallery-button tribute-gallery-strip-button"
                      type="button"
                      role="listitem"
                      aria-label={`Open gallery image ${(index % galleryImages.length) + 1} of ${galleryImages.length}`}
                      onClick={() => {
                        if (!stripUsesNativeGesturesOnly && suppressStripClickRef.current) return;
                        setActiveIndex(index % galleryImages.length);
                      }}
                    >
                      <img
                        className="gallery-item tribute-gallery-strip-item tribute-gallery-strip-image"
                        src={image.imageUrl}
                        alt={`Gallery memory ${(index % galleryImages.length) + 1}`}
                        draggable={false}
                        loading={index < galleryImages.length ? "eager" : "lazy"}
                        decoding="async"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            // empty state...
            <>
              <div className="gallery-stream" aria-hidden="true">
                <div className="gallery-track">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="gallery-item" />
                  ))}
                </div>
              </div>
              <MarkdownText content={galleryNote} className="subtle-note" />
            </>
          )}
        </div>
      </section>

      {/* Lightbox remains unchanged */}
      {activeImage && (
        <div className="message-modal-overlay tribute-gallery-lightbox" role="dialog" aria-modal="true" onClick={closeActiveImage}>
          <div className="message-modal-card tribute-gallery-lightbox-card" onClick={(e) => e.stopPropagation()}>
            {/* ... lightbox content unchanged ... */}
            <div className="message-modal-head">
              <div>
                <p className="message-modal-kicker">Moments in Memory</p>
                <h3>{`Image ${activeImageNumber} of ${galleryImages.length}`}</h3>
              </div>
              <button className="message-modal-close" type="button" onClick={closeActiveImage}>
                Close
              </button>
            </div>

            <div className="tribute-gallery-lightbox-body">
              {galleryImages.length > 1 && <button className="tribute-gallery-arrow tribute-gallery-arrow-left" onClick={showPreviousImage}>‹</button>}

              <div ref={viewportRef} className="tribute-gallery-viewport" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onWheel={handleWheel}>
                <img className="tribute-gallery-full-image" src={activeImage.imageUrl} alt={`Gallery memory ${activeImageNumber}`} draggable={false} />
              </div>

              {galleryImages.length > 1 && <button className="tribute-gallery-arrow tribute-gallery-arrow-right" onClick={showNextImage}>›</button>}
            </div>

            <p className="subtle-note tribute-gallery-lightbox-note">
              Use the arrows or your keyboard to move between images. Drag or scroll to pan larger photos.
            </p>
          </div>
        </div>
      )}
    </>
  );
}