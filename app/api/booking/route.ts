import type { NextRequest } from "next/server";
import { getRooms } from "@/lib/cmsContent";
import { site } from "@/lib/content";
import { formatPrice } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * Booking enquiries are forwarded to a Google Apps Script web app, which sends
 * the email and returns `{ "ok": true }`. The web-app URL stays on the server
 * (`GOOGLE_APPS_SCRIPT_BOOKING_URL`) so it can be swapped or revoked without a
 * redeploy, and the shared secret (`BOOKING_WEBHOOK_SECRET`) lets the script
 * reject anything that did not come from this site.
 *
 * Setup: see `scripts/google-apps-script/booking.gs` for the script and
 * `.env.example` for the two environment variables.
 */

type Submission = {
  form?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  room?: unknown;
  roomCategory?: unknown;
  mealPlan?: unknown;
  adults?: unknown;
  children?: unknown;
  checkin?: unknown;
  checkout?: unknown;
  guests?: unknown;
  notes?: unknown;
  company?: unknown;
};

const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_PER_WINDOW) return false;

  entry.count += 1;
  return true;
}

function text(value: unknown, max: number): string {
  // The popup steppers send guests/rooms as numbers, not strings.
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value)).slice(0, max);
  }
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!rateLimit(ip)) {
    return Response.json(
      { ok: false, error: "Too many requests. Please try again in a few minutes." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  let input: Submission;

  try {
    input = (await request.json()) as Submission;
  } catch {
    return Response.json(
      { ok: false, error: "Could not read that request." },
      { status: 400 },
    );
  }

  // Hidden field filled by bots. Pretend it worked so they do not retry.
  if (text(input.company, 200)) {
    return Response.json({ ok: true }, { status: 201 });
  }

  const form = text(input.form, 16).toLowerCase();
  const name = text(input.name, 80);
  const email = text(input.email, 160);
  const phone = text(input.phone, 40);
  const roomSlug = text(input.room, 96);
  const roomCategory = text(input.roomCategory, 64);
  const isPopup = form === "popup" || roomCategory.length > 0;
  const checkin = text(input.checkin, 10);
  const checkout = text(input.checkout, 10);
  const notes = text(input.notes, 1500);

  if (name.length < 2) {
    return Response.json(
      { ok: false, error: "Please add your name." },
      { status: 422 },
    );
  }

  // Both forms require a phone number. The popup is phone-first; the contact
  // form used to accept "email or phone", which let requests through without
  // a number the team could actually call.
  if (phone.replace(/\D/g, "").length < 8) {
    return Response.json(
      { ok: false, error: "Please add a phone number." },
      { status: 422 },
    );
  }

  // The contact form asks for an email (marked *). The popup treats it as
  // optional, but if one is supplied it still has to be valid.
  if (!isPopup && !email) {
    return Response.json(
      { ok: false, error: "Please add an email address." },
      { status: 422 },
    );
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return Response.json(
      { ok: false, error: "Please enter a valid email." },
      { status: 422 },
    );
  }

  if ((checkin && !isDate(checkin)) || (checkout && !isDate(checkout))) {
    return Response.json(
      { ok: false, error: "Please pick a valid date." },
      { status: 422 },
    );
  }

  if (checkin && checkout && checkout <= checkin) {
    return Response.json(
      { ok: false, error: "Check-out must be after check-in." },
      { status: 422 },
    );
  }

  // Room naming for the lead email: the contact form uses the CMS room name
  // + price; the homepage popup no longer asks for a room, so the team
  // confirms it in the reply.
  let roomName = "Not specified";
  let roomSlugForPayload = "";
  let nightlyRate = "";
  let guests = "2";

  if (!isPopup) {
    const rooms = await getRooms();
    const room = rooms.find((item) => item.slug === roomSlug);
    if (!room) {
      return Response.json(
        { ok: false, error: "Please choose a room." },
        { status: 422 },
      );
    }
    roomName = room.name;
    roomSlugForPayload = room.slug;
    nightlyRate = formatPrice(room.price);
    guests = text(input.guests, 40) || "2";
  } else if (roomCategory) {
    // Backwards compatibility for an older popup payload that still sent a
    // room category. It is no longer part of the form.
    roomName = roomCategory;
  }

  const webhook = process.env.GOOGLE_APPS_SCRIPT_BOOKING_URL;
  if (!webhook) {
    console.error(
      "[booking] GOOGLE_APPS_SCRIPT_BOOKING_URL is not set. Follow scripts/google-apps-script/booking.gs and add the deployment URL to the environment.",
    );
    return Response.json(
      {
        ok: false,
        error:
          "Online booking is not connected yet. Please send the request on WhatsApp or call us — both buttons are right there.",
      },
      { status: 503 },
    );
  }

  const submittedAt = new Date().toISOString();

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        secret: process.env.BOOKING_WEBHOOK_SECRET || "",
        name,
        email,
        phone,
        room: roomName,
        roomSlug: roomSlugForPayload,
        nightlyRate,
        form: isPopup ? "popup" : "contact",
        checkin,
        checkout,
        guests,
        notes,
        submittedAt,
        source: isPopup ? site.url + "/ (booking popup)" : site.url + "/contact",
      }),
    });

    const raw = await response.text().catch(() => "");
    let payload: { ok?: boolean; error?: string } | null = null;
    try {
      payload = raw ? (JSON.parse(raw) as { ok?: boolean; error?: string }) : null;
    } catch {
      // A login page or an HTML error wrapper is not a success: the script
      // must answer with `{"ok":true}`.
      payload = null;
    }

    if (!response.ok || payload?.ok !== true) {
      console.error("[booking] Apps Script did not acknowledge the request.", {
        status: response.status,
        body: raw.slice(0, 500),
      });
      return Response.json(
        {
          ok: false,
          error:
            payload?.error ||
            "We could not confirm the request just now. Please try again, or use WhatsApp.",
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(
      { ok: true },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[booking] Could not reach the Apps Script web app.", error);
    return Response.json(
      {
        ok: false,
        error:
          "We could not send the request just now. Please try again, or use WhatsApp.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
