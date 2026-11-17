import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import BookingForm from "@/components/BookingForm";
import { site } from "@/lib/content";
import { JsonLd, breadcrumb } from "@/lib/schema";
import { pageMeta } from "@/lib/metadata";
import { getRooms } from "@/lib/cmsContent";

export const revalidate = 300;

export const metadata = pageMeta({
  title: "Contact & Direct Booking — Jade River Resort",
  description:
    "Reserve directly with Jade River Resort, Pahalgam. Choose a room, add dates and guests, and send a booking request straight to the resort team.",
  path: "/contact",
});

export default async function ContactPage() {
  const rooms = await getRooms();

  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHeader
        eyebrow="Contact · Direct only"
        title={
          <>
            Tell us when.
            <br />
            We’ll keep the <em className="text-clay">river ready.</em>
          </>
        }
        intro="No booking engine, no OTA, no commission. Choose a room, add your dates, and send the request — a person from the resort replies with availability and the final rate."
        aside={
          <div className="flex items-end justify-between border-t border-line pt-5">
            <div>
              <p className="eyebrow text-ink/65">Direct line</p>
              <a href={site.phoneHref} className="link-line mt-1 block font-display text-[1.5rem]">
                {site.phone}
              </a>
            </div>
            <span className="mb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink/65">
              Phone &amp; WhatsApp
            </span>
          </div>
        }
      />

      <section className="shell pb-6">
        <div className="grid gap-10 border-b border-line pb-8 md:grid-cols-12 md:gap-14">
          <p className="eyebrow text-ink/65 md:col-span-3">How a stay starts</p>
          <div className="max-w-[62ch] space-y-4 text-[0.95rem] leading-relaxed text-ink/75 md:col-span-8">
            <p>
              Pick a room, add your dates and the number of guests, and send the
              request. It reaches the resort inbox immediately, and a person
              from the team answers — not a portal, not a bot — usually within
              the hour on working days, with availability and the final rate
              against the 50% advance. If you would rather not wait, the same
              details can be sent on WhatsApp in one tap.
            </p>
            <p>
              1 · Choose a room. 2 · Send the request form (or the WhatsApp
              note). 3 · We confirm the dates and the advance — GST, invoices
              and group rates go through email. Nobody takes a commission on your stay, which is
              the whole point of booking directly. On arrival all you need is a
              government photo ID — check-in runs from 2:00 PM, check-out from
              12:00 noon, and bags can be held for the morning if you land
              early.
            </p>
          </div>
        </div>
      </section>

      <section className="shell pb-24 md:pb-32">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-7" data-reveal="zoom">
            <h2 className="sr-only">Reserve rooms at Jade River Resort, directly</h2>
            <BookingForm rooms={rooms} />
          </div>

          <aside className="md:col-span-4 md:col-start-9">
            <div className="md:sticky md:top-28 space-y-8" data-reveal="zoom" style={{ ["--reveal-delay" as string]: "100ms" }}>
              <div className="border-t border-line pt-5">
                <p className="eyebrow text-ink/65">The resort</p>
                <p className="mt-4 font-display text-[1.5rem] leading-tight">
                  Jade River Resort
                </p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/70">
                  {site.address}
                  <br />
                  {site.coords}
                </p>
                <a href={`mailto:${site.email}`} className="link-line mt-4 inline-block text-[0.95rem]">
                  {site.email}
                </a>
              </div>

              <div className="border-t border-line pt-5">
                <p className="eyebrow text-ink/65">Reservations &amp; policies</p>
                <p className="mt-4 text-[0.9rem] leading-[1.8] text-ink/70">
                  Group reservations, policy, GST &amp; invoices:
                  <br />
                  <a href={`mailto:${site.email}`} className="link-line text-ink">
                    {site.email}
                  </a>
                </p>
              </div>

              <div className="border-t border-line pt-5">
                <p className="eyebrow text-ink/65">Before you book</p>
                <ul className="mt-4 space-y-2.5">
                  {[
                    "50% advance confirms the booking",
                    "Check-in 2:00 PM · out 12:00 noon",
                    "Government photo ID required",
                    "Free cancellation 15+ days out",
                  ].map((item) => (
                    <li key={item} className="flex items-baseline gap-3 text-[0.9rem] text-ink/70">
                      <span className="h-1 w-1 shrink-0 translate-y-[-2px] bg-copper" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/policies" className="link-line mt-5 inline-block font-mono text-[10px] uppercase tracking-[0.18em]">
                  Full policies →
                </Link>
              </div>

              <div className="bg-forest p-6 text-paper" data-reveal="zoom">
                <p className="eyebrow text-paper/65">Prefer to talk?</p>
                <p className="mt-3 font-display text-[1.5rem] leading-tight">
                  A direct line to the people who run the place.
                </p>
                <a href={site.phoneHref} className="link-line mt-4 inline-block font-mono text-[11px] tracking-[0.14em]">
                  {site.phone}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
