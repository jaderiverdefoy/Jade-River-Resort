import PageHeader from "@/components/PageHeader";
import ReviewForm from "@/components/ReviewForm";
import ReviewText from "@/components/ReviewText";
import { getDisplayReviews } from "@/lib/googleReviews";
import { JsonLd, breadcrumb, reviewListSchema } from "@/lib/schema";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Guest Reviews — Jade River Resort, Pahalgam",
  description:
    "Notes left by guests of Jade River Resort: the river, the balcony rooms, the bonfire evenings and the quiet. Read what people wrote.",
  path: "/reviews",
});

export default async function ReviewsPage() {
  const { reviews, rating, total, mapsUrl } = await getDisplayReviews();
  const googleAttribution = Boolean(mapsUrl);
  const averageRating =
    rating ??
    (reviews.length > 0
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          ).toFixed(1),
        )
      : null);

  return (
    <>
      <JsonLd
        data={breadcrumb([
          { name: "Home", path: "/" },
          { name: "Reviews", path: "/reviews" },
        ])}
      />
      {averageRating && reviews.length > 0 ? (
        <JsonLd
          data={reviewListSchema({
            rating: averageRating,
            count: total ?? reviews.length,
            reviews,
          })}
        />
      ) : null}
      <PageHeader
        eyebrow={
          googleAttribution ? "Guest notes · Google & guests" : "Guest notes"
        }
        title={
          <>
            Notes left by <em className="text-clay">guests.</em>
          </>
        }
        intro=""
        aside={
          <div className="flex items-end justify-between border-t border-line pt-5">
            <div>
              <p className="eyebrow text-ink/65">Your note</p>
            </div>
            <a href="#write" className="link-line mb-1 font-mono text-[10px] uppercase tracking-[0.18em]">
              Leave a note →
            </a>
          </div>
        }
      />

      <section className="shell pb-6">
        <div className="grid gap-10 border-b border-line pb-8 md:grid-cols-12 md:gap-14">
          <p className="eyebrow text-ink/65 md:col-span-3">What the notes say</p>
          <div className="max-w-[62ch] space-y-4 text-[0.95rem] leading-relaxed text-ink/75 md:col-span-8">
            <p>
              Read enough of them and the same three things keep coming up: the
              quiet — the Lidder on the other side of the window and nothing
              else to answer to — the rooms, which guests describe as simply
              honest and genuinely comfortable, and the fact that booking is
              direct, with nobody taking a cut on the way.
            </p>
            <p>
              The notes are left by guests on the resort’s own form and on
              Google. We do not edit, merge or re-order them; if you booked,
              stayed and wrote, it is what is printed here. A sentence about
              the room, the balcony or the morning tea is worth more to the
              next guest than a paragraph of adjectives.
            </p>
          </div>
        </div>
      </section>

      <section className="shell pb-20">
        {googleAttribution ? (
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/65">
              {rating
                ? `${rating.toFixed(1)} ★ from ${total ?? reviews.length} Google reviews`
                : "Reviews from Google"}
            </p>
            <a
              href={mapsUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="link-line font-mono text-[10px] uppercase tracking-[0.18em]"
            >
              Read on Google ↗
            </a>
          </div>
        ) : null}

        <div className="grid gap-x-6 gap-y-10 md:grid-cols-3">
          {reviews.length === 0 ? (
            <div className="md:col-span-3 border-t border-line pt-8">
              <p className="font-display text-[clamp(1.8rem,3vw,2.8rem)] leading-[1.05]">
                No guest notes yet.
              </p>
              <p className="mt-4 max-w-md text-[0.95rem] leading-[1.7] text-ink/70">
                Be the first to leave a note about your stay.
              </p>
              <a
                href="#write"
                className="link-line mt-6 inline-block font-mono text-[10px] uppercase tracking-[0.18em]"
              >
                Leave a note →
              </a>
            </div>
          ) : (
            reviews.map((review, i) => (
              <article
                key={`${review.name}-${i}`}
                className="group border-t border-line pt-6"
                data-reveal="zoom"
                style={{ ["--reveal-delay" as string]: `${(i % 3) * 80}ms` }}
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className="text-[13px] tracking-[0.18em] text-clay"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {"★".repeat(review.rating)}
                      <span className="text-ink/15">{"★".repeat(5 - review.rating)}</span>
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/65">
                      {review.date}
                    </span>
                  </div>
                  {review.title ? (
                    <h3 className="font-bold mt-5 font-display text-[clamp(1.5rem,2.2vw,2.1rem)] leading-[1.05] tracking-[-0.03em] transition-colors duration-500 group-hover:text-clay">
                      {review.title}
                    </h3>
                  ) : null}
                </div>
                <div>
                  <ReviewText
                    body={review.body}
                    className={`${
                      review.title ? "mt-4" : "mt-0"
                    } text-[0.96rem] leading-[1.75] text-ink/70`}
                  />
                  <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                    <p className="text-[0.9rem]">{review.name}</p>
                    {review.from ? (
                      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink/65">
                        {review.from}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="border-t border-line py-16 md:py-24">
        <div className="shell grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="eyebrow text-ink/65" data-reveal>
              Leave a note
            </span>
            <h2 className="mt-4 text-[clamp(2rem,3.6vw,3.4rem)] leading-[0.98]" data-reveal>
              Stayed with us? <em className="text-clay">Tell it plainly.</em>
            </h2>
            <p className="body-copy mt-6" data-reveal style={{ ["--reveal-delay" as string]: "80ms" }}>
              A sentence about the room, the river, or the morning tea is more useful
              than a paragraph of adjectives.
            </p>
          </div>
          <div className="md:col-span-7 md:col-start-6" data-reveal="zoom">
            <ReviewForm />
          </div>
        </div>
      </section>
    </>
  );
}
