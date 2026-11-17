import type { PortableTextBlock } from "@portabletext/types";

export type SanityImage = {
  asset?: { _ref?: string; _type?: string } | null;
  alt?: string;
  caption?: string;
  hotspot?: unknown;
  crop?: unknown;
};

export type SanitySeo = {
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  canonicalUrl?: string;
  noIndex?: boolean;
  ogImage?: SanityImage | null;
};

export type SanityPostListItem = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  readTime?: string;
  featured?: boolean;
  mainImage?: SanityImage | null;
  author?: { name: string; role?: string } | null;
  category?: { title: string; slug?: string } | null;
  seo?: Pick<SanitySeo, "metaTitle" | "metaDescription" | "focusKeyword"> | null;
};

export type SanityPost = SanityPostListItem & {
  heroImage?: SanityImage | null;
  body?: PortableTextBlock[] | null;
  author?: { name: string; role?: string; image?: SanityImage | null; bio?: string } | null;
  seo?: SanitySeo | null;
  articleType?: string;
  relatedPosts?: SanityPostListItem[] | null;
};

export type SanityRoom = {
  _id: string;
  name: string;
  slug: string;
  short: string;
  units?: number;
  countLabel?: string;
  price: number;
  description: string;
  long: string;
  note: string;
  metaDescription: string;
  bestFor: string;
  amenities?: string[];
  mainImage?: SanityImage | null;
  gallery?: SanityImage[] | null;
};

export type SanityGalleryImage = {
  _id: string;
  span?: "wide" | "std" | "tall";
  image?: SanityImage | null;
};

export type SanityExperience = {
  _id: string;
  title: string;
  subtitle: string;
  body: string;
  meta: string;
  image?: SanityImage | null;
};

export type SanityReview = {
  _id: string;
  name?: string;
  location?: string;
  rating?: number;
  title?: string;
  body?: string;
  dateLabel?: string;
  submittedAt?: string;
  publishedAt?: string;
};
