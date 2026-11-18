"use client";

import { useEffect, useState } from "react";

/**
 * Floating "back to top" control. Appears once the reader is a screen or so
 * down the page, sits directly above the WhatsApp bubble so the two never
 * overlap, and scrolls with the browser's own smooth behaviour (Lenis leaves
 * programmatic scrolls alone).
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      title="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-[5.25rem] right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-paper/90 text-ink shadow-[0_10px_40px_rgba(33,51,41,0.16)] backdrop-blur transition-all duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-0.5 hover:border-walnut hover:text-walnut md:bottom-[6.25rem] md:right-8 ${
        visible ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 13V3M8 3 3.5 7.5M8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </button>
  );
}
