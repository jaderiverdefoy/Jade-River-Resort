import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import RoomShowcase from "@/components/rooms/RoomShowcase";
import { JsonLd, breadcrumb } from "@/lib/schema";
import { getRooms, getRoomsTotal } from "@/lib/cmsContent";
import { pageMeta } from "@/lib/metadata";
import { numberWord } from "@/lib/utils";

export const revalidate = 300;

export const metadata = pageMeta({
  title: "Rooms & Suites — Jade River Resort, Pahalgam",
  description:
    "Thirteen rooms at Jade River Resort: nine Premium Balcony Rooms, two Executive Suites and two Executive Duplex Family Rooms. Direct booking.",
  path: "/rooms",
});

export default async function RoomsPage() {
  const [rooms, total] = await Promise.all([getRooms(), getRoomsTotal()]);

  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "Home", path: "/" },
          { name: "Rooms", path: "/rooms" },
        ])}
      />
      <PageHeader
        eyebrow={`Stay · ${total} rooms`}
        title={
          <>
            {total === 13 ? "Thirteen" : total} rooms.
            <br />
            {numberWord(rooms.length)} ways to{" "}
            <em className="text-clay">slow down.</em>
          </>
        }
        intro="Nine balcony rooms, two suites, two duplex family rooms. Each one opens toward the water or the pines, and none of them are in a hurry."
        aside={
          <div className="flex items-end justify-between border-t border-line pt-5">
            <div>
              <p className="eyebrow text-ink/65">From</p>
              <p className="mt-1 font-display text-[1.9rem] leading-none">₹6,000</p>
            </div>
            <Link href="/contact" className="link-line font-mono text-[10px] uppercase tracking-[0.2em]">
              Check dates →
            </Link>
          </div>
        }
      />

      <h2 className="sr-only">Rooms and suites at Jade River Resort, Pahalgam</h2>
      <RoomShowcase rooms={rooms} />

      <section className="bg-forest py-16 text-paper md:py-20" data-reveal="zoom">
        <div className="shell grid gap-10 md:grid-cols-12 md:items-center">
          <p className="font-display text-[clamp(1.8rem,3.4vw,3.2rem)] leading-[1.05] md:col-span-7" data-reveal>
            Not sure which room? Tell us who is coming and we will{" "}
            <em className="text-clay">place you properly.</em>
          </p>
          <div className="flex flex-wrap gap-4 md:col-span-5 md:justify-end" data-reveal="zoom" style={{ ["--reveal-delay" as string]: "100ms" }}>
            <Link href="/contact" className="btn border-paper/30 text-paper">
              Reserve directly
            </Link>
            <a
              href="https://wa.me/919541898820"
              className="link-line self-center font-mono text-[10px] uppercase tracking-[0.2em] text-paper/70"
            >
              WhatsApp us →
            </a>
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {rooms.map((room, i) => (
            <div
              key={room.slug}
              className="border-t border-line pt-4"
              data-reveal="zoom"
              style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}
            >
              <p className="eyebrow text-ink/65">{room.count}</p>
              <p className="mt-2 text-[0.95rem]">{room.name}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
