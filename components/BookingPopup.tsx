"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { site } from "@/lib/content";

/**
 * Home-page booking popup. Opens two ways: the hero Reserve button dispatches
 * `jr:open-booking`, and the popup opens itself a few seconds after the page
 * settles so a ready-to-book visitor does not have to hunt for it. Consistent
 * with the contact form: `/api/booking` forwards the enquiry to the Google
 * Apps Script, which emails the team and logs the row to the Popup sheet tab;
 * the browser lands on `/thank-you`.
 *
 * The popup deliberately asks for the smallest useful set — name, phone,
 * email and a travel date — on both desktop and mobile. The team confirms the
 * room, meal plan and dates on the reply.
 */
export const OPEN_BOOKING_EVENT = "jr:open-booking";

/** Delay before the popup opens itself. Long enough for the intro to clear
 *  and for a visitor to settle into the hero first. */
const AUTO_OPEN_MS = 4500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Errors = {
  name?: string;
  phone?: string;
  email?: string;
};

export default function BookingPopup() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  // Only a deliberate click on "Reserve" should pull focus into the name
  // field — auto-opening must not pop the mobile keyboard.
  const focusOnOpen = useRef(false);
  // Guards the backdrop against a stray tap that started before the popup
  // appeared (common on phones: tap-and-scroll, popup opens, the tail of that
  // gesture lands on the overlay and closes it immediately).
  const openedAt = useRef(0);
  const autoOpened = useRef(false);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [company, setCompany] = useState("");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [error, setError] = useState<string | null>(null);

  // Listen for the Reserve button, and open on its own shortly after landing
  // on the home page. The timer only runs on mount, so closing the popup does
  // not make it pop back up during the same visit.
  useEffect(() => {
    const mountedAt = Date.now();

    const onOpen = () => {
      focusOnOpen.current = true;
      setOpen(true);
    };
    window.addEventListener(OPEN_BOOKING_EVENT, onOpen);

    // Mobile browsers suspend timers in background tabs, and some in-app
    // browsers (Instagram, Facebook) delay them until the page is visible.
    // This fallback makes sure the popup still arrives on the first view.
    const autoOpen = () => {
      if (autoOpened.current) return;
      autoOpened.current = true;
      setOpen(true);
    };
    const timer = window.setTimeout(autoOpen, AUTO_OPEN_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - mountedAt < 10_000) {
        autoOpen();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener(OPEN_BOOKING_EVENT, onOpen);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    openedAt.current = Date.now();
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    if (focusOnOpen.current) nameRef.current?.focus({ preventScroll: true });
    focusOnOpen.current = false;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const waMessage = useMemo(() => {
    const lines = [
      "Hello Jade River Resort, I would like to book a stay.",
      "",
      name ? `Name: ${name}` : null,
      phone ? `Phone: ${phone}` : null,
      email ? `Email: ${email}` : null,
      travelDate ? `Travel date: ${travelDate}` : null,
      "",
      "Please confirm availability and next steps.",
    ].filter(Boolean);
    return lines.join("\n");
  }, [name, phone, email, travelDate]);

  const waHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(waMessage)}`;

  const validate = (): Errors => {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Add your name.";
    if (phone.replace(/\D/g, "").length < 8) {
      next.phone = "Add a valid phone number.";
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email.";
    }
    return next;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setError(null);

    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: "popup",
          name,
          phone,
          email,
          checkin: travelDate,
          company,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "We could not send the request.");
      }

      try {
        sessionStorage.setItem(
          "jr-booking",
          JSON.stringify({ checkin: travelDate }),
        );
      } catch {
        // Same as the contact form: storage-blocked visitors get a generic thank-you page.
      }

      router.push("/thank-you");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not send the request. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Book your stay"
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 sm:p-6"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-charcoal/80"
        aria-label="Close booking popup"
        onClick={() => {
          // Ignore a tap that was already in progress when the popup opened.
          if (Date.now() - openedAt.current > 350) setOpen(false);
        }}
      />

      <div className="popup-scroll relative max-h-[calc(100svh-2rem)] w-full max-w-[26rem] overflow-y-auto rounded-md border border-walnut/40 bg-paper shadow-[0_30px_80px_rgba(20,24,21,0.5)] sm:max-h-[90svh] sm:max-w-[27rem]">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center border border-line text-ink/65 transition-colors hover:border-ink hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2 12 12M12 2 2 12" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>

        <div className="px-4 pb-5 pt-4 short:py-4 micro:py-3 sm:px-6 sm:py-6">
          <p className="eyebrow text-ink/65 micro:hidden">Book direct</p>
          <h2 className="mt-1 font-display text-[clamp(1.2rem,2.2vw,1.5rem)] leading-[1.05] tracking-[-0.03em] micro:hidden">
            Book your stay.
          </h2>

          <form className="mt-3 grid gap-3 short:gap-2" onSubmit={submit} noValidate>
            <div className="grid gap-3 short:gap-2">
              <Field
                label={<>01 — Your name <span className="text-clay">*</span></>}
                htmlFor="popup-name"
                error={errors.name}
              >
                <input
                  ref={nameRef}
                  id="popup-name"
                  name="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  placeholder="Full name"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  required
                  className="w-full bg-transparent py-2 text-[0.95rem] outline-none placeholder:text-ink/65 short:py-1.5"
                />
              </Field>

              <Field
                label={<>02 — Phone <span className="text-clay">*</span></>}
                htmlFor="popup-phone"
                error={errors.phone}
              >
                <input
                  id="popup-phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                  }}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  required
                  className="w-full bg-transparent py-2 text-[0.95rem] outline-none placeholder:text-ink/65 short:py-1.5"
                />
              </Field>

              <Field
                label="03 — Email"
                htmlFor="popup-email"
                error={errors.email}
              >
                <input
                  id="popup-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  className="w-full bg-transparent py-2 text-[0.95rem] outline-none placeholder:text-ink/65 short:py-1.5"
                />
              </Field>

              <Field label="04 — Travel date" htmlFor="popup-travel-date">
                <input
                  id="popup-travel-date"
                  name="checkin"
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-transparent py-2 text-[0.95rem] outline-none short:py-1.5"
                />
              </Field>
            </div>

            {/* Honeypot */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="popup-company">Company</label>
              <input
                id="popup-company"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            {error ? (
              <p role="alert" className="border border-clay/40 bg-clay/5 px-4 py-3 text-[0.9rem] leading-relaxed text-ink">
                {error}{" "}
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="link-line text-walnut">
                  Send it on WhatsApp instead →
                </a>
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3 short:pt-3 sm:gap-4 sm:pt-4">
              <button
                type="submit"
                className="btn btn-clay short:py-3 micro:py-2 disabled:opacity-60"
                disabled={sending}
              >
                {sending ? "Sending…" : "Send booking request"}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="arrow-static">
                  <path d="M2 12L12 2M12 2H4M12 2V10" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="link-line font-mono text-[10px] uppercase tracking-[0.2em]"
              >
                Or send on WhatsApp
              </a>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
  error,
}: {
  label: React.ReactNode;
  htmlFor: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div
      className={`group border-b pb-1 ${
        error ? "border-clay" : "border-line focus-within:border-clay"
      }`}
    >
      <label htmlFor={htmlFor} className="eyebrow block text-ink/65">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-clay">
          {error}
        </p>
      ) : null}
    </div>
  );
}
