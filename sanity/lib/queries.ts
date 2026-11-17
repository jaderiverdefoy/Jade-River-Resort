import { groq } from "next-sanity";

const listFields = groq`
  _id,
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  readTime,
  featured,
  mainImage { asset, alt },
  author-> { name, role },
  category-> { title, "slug": slug.current },
  seo { metaTitle, metaDescription, focusKeyword }
`;

export const allPostsQuery = groq`
  *[_type == "post" && !(_id in path("drafts.**"))]
  | order(publishedAt desc) {
    ${listFields}
  }
`;

export const latestPostsQuery = groq`
  *[_type == "post" && !(_id in path("drafts.**"))]
  | order(publishedAt desc)
  [0...$limit] {
    ${listFields}
  }
`;

export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
    ${listFields},
    heroImage { asset, alt },
    body,
    author-> { name, role, image, bio },
    seo,
    articleType,
    relatedPosts[]-> {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      readTime,
      mainImage { asset, alt },
      category-> { title, "slug": slug.current }
    }
  }
`;

export const draftPostBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    ${listFields},
    heroImage { asset, alt },
    body,
    author-> { name, role, image, bio },
    seo,
    articleType,
    relatedPosts[]-> {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      publishedAt,
      readTime,
      mainImage { asset, alt },
      category-> { title, "slug": slug.current }
    }
  }
`;

/**
 * Rooms, gallery and experiences are optional CMS-managed content. Each query
 * returns an empty list when nothing has been published, which lets the site
 * fall back to the built-in content in `lib/content.ts`.
 */
export const roomsQuery = groq`
  *[_type == "room" && active != false && defined(slug.current) && !(_id in path("drafts.**"))]
  | order(coalesce(order, 9999) asc, name asc) {
    _id,
    name,
    "slug": slug.current,
    short,
    units,
    countLabel,
    price,
    description,
    long,
    note,
    metaDescription,
    bestFor,
    amenities,
    mainImage { asset, alt },
    gallery[] { asset, alt }
  }
`;

export const galleryImagesQuery = groq`
  *[_type == "galleryImage" && active != false && defined(image.asset) && !(_id in path("drafts.**"))]
  | order(coalesce(order, 9999) asc, _createdAt asc) {
    _id,
    span,
    image { asset, alt }
  }
`;

export const experiencesQuery = groq`
  *[_type == "experience" && active != false && defined(image.asset) && !(_id in path("drafts.**"))]
  | order(coalesce(order, 9999) asc, _createdAt asc) {
    _id,
    title,
    subtitle,
    body,
    meta,
    image { asset, alt }
  }
`;


export const allSlugsQuery = groq`
  *[_type == "post" && !(_id in path("drafts.**")) && defined(slug.current)]
  { "slug": slug.current }
`;

/**
 * Approved guest reviews only. Pending and rejected submissions stay in the
 * Studio and never reach the public website.
 */
export const approvedReviewsQuery = groq`
  *[
    _type == "review" &&
    status == "approved" &&
    !(_id in path("drafts.**"))
  ]
  | order(coalesce(publishedAt, submittedAt, _createdAt) desc) {
    _id,
    name,
    location,
    rating,
    title,
    body,
    dateLabel,
    submittedAt,
    publishedAt
  }
`;
