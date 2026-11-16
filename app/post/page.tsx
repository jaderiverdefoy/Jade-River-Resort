import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getAllPosts } from "@/lib/posts";
import { JsonLd, breadcrumb } from "@/lib/schema";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Blog — notes from Jade River Resort",
  description:
    "Notes from Jade River Resort: the sound of the Lidder at dawn and a slow guide to Aru Valley. Field notes from Pahalgam.",
  path: "/post",
});

export default async function BlogPage() {
  const posts = await getAllPosts();
  const [lead, ...rest] = posts;

  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/post" },
        ])}
      />
      <PageHeader
        eyebrow="Blog · Notes"
        title={
          <>
            Notes from the <em className="text-clay">slow side.</em>
          </>
        }
        intro="Field notes, small observations, and the occasional practical guide. Written from the property, between cups of tea."
        aside={
          <div className="flex items-end justify-between border-t border-line pt-5">
            <p className="font-mono text-[9px] uppercase leading-[1.9] tracking-[0.16em] text-ink/65">
              Blog entries
              <br />
              Pahalgam · Kashmir
            </p>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
              {posts.length} {posts.length === 1 ? "note" : "notes"}
            </span>
          </div>
        }
      />

      <section className="shell pb-6">
        <div className="grid gap-10 border-b border-line pb-8 md:grid-cols-12 md:gap-14">
          <p className="eyebrow text-ink/65 md:col-span-3">Why we write</p>
          <div className="max-w-[62ch] space-y-4 text-[0.95rem] leading-relaxed text-ink/75 md:col-span-8">
            <p>
              Nothing here is filler. These are field notes from the property —
              the sound of the Lidder at six in the morning, the case for
              keeping a resort at thirteen rooms, and a slow, practical guide to
              the Aru valley when you have a day to spend and somewhere you
              would rather not rush to.
            </p>
            <p>
              If something here answers your question better than the FAQ does,
              write to us anyway — the resort answers its own correspondence.
              Current notes: the sound of the Lidder at dawn; why thirteen rooms
              is the point; a slow guide to Aru Valley.
            </p>
          </div>
        </div>
      </section>

      <section className="shell pb-24 md:pb-32">
        <h2 className="sr-only">Blog posts from Pahalgam</h2>
        {!lead ? (
          <div className="border-t border-line pt-10" data-reveal>
            <p className="font-display text-[clamp(1.6rem,3vw,2.4rem)] leading-snug text-ink/70">
              Notes from the valley, coming soon.
            </p>
            <p className="body-copy mt-4 max-w-md">
              We&apos;re writing the first field notes from the property. In the
              meantime, write to us and we&apos;ll tell you what the valley is doing
              this week.
            </p>
            <Link
              href="/contact"
              className="link-line mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.2em]"
            >
              Write to us →
            </Link>
          </div>
        ) : (
          <>
            <Link
              href={`/post/${lead.slug}`}
              className="group grid gap-8 border-t border-line pt-8 md:grid-cols-12 md:gap-10"
            >
              <div className="md:col-span-7" data-reveal="zoom">
                <div className="relative aspect-[16/11] overflow-hidden bg-paper-2">
                  <Image
                    src={lead.image}
                    alt={lead.imageAlt}
                title={lead.imageAlt}
                    width={1600}
                    height={900}
                    priority
                    sizes="(min-width: 768px) 58vw, 100vw"
                    className="absolute inset-0 h-full w-full reveal-media object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-5 top-5 bg-paper px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em]">
                    Featured note
                  </span>
                </div>
              </div>

              <div className="flex flex-col justify-between md:col-span-4 md:col-start-9" data-reveal="zoom" style={{ ["--reveal-delay" as string]: "90ms" }}>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/65">
                    {lead.category} · {lead.date}
                  </p>
                  <h3 className="font-bold mt-4 text-[clamp(2rem,3.6vw,3.4rem)] leading-[0.98] transition-colors duration-500 group-hover:text-clay">
                    {lead.title}
                  </h3>
                  <p className="body-copy mt-5">{lead.excerpt}</p>
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-line pt-4">
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/65">
                    {lead.read} read
                  </span>
                  <span>→</span>
                </div>
              </div>
            </Link>

            {rest.length > 0 && (
              <div className="mt-16 grid gap-10 md:grid-cols-2">
                {rest.map((post, i) => (
                  <Link
                    key={post.slug}
                    href={`/post/${post.slug}`}
                    className="group border-t border-line pt-6"
                    data-reveal="zoom"
                    style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}
                  >
                    <div
                      className="relative aspect-[16/10] overflow-hidden bg-paper-2"
                      data-reveal="mask"
                    >
                      <Image
                        src={post.image}
                        alt={post.imageAlt}
                title={post.imageAlt}
                        width={1600}
                        height={900}
                        sizes="(min-width: 768px) 48vw, 100vw"
                        className="absolute inset-0 h-full w-full reveal-media object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
                      />
                    </div>
                    <div className="mt-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/65">
                          {post.category} · {post.date}
                        </p>
                        <h3 className="font-bold mt-3 font-display text-[clamp(1.5rem,2.4vw,2.2rem)] leading-[1.05] transition-colors duration-500 group-hover:text-clay">
                          {post.title}
                        </h3>
                        <p className="mt-3 max-w-[42ch] text-[0.92rem] leading-relaxed text-ink/70">
                          {post.excerpt}
                        </p>
                      </div>
                      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-500 group-hover:border-walnut group-hover:bg-walnut group-hover:text-paper">
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                          <path d="M2 12L12 2M12 2H4M12 2V10" stroke="currentColor" strokeWidth="1.2" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
