import { defineField, defineType } from "sanity";

/**
 * A bookable room type. The website reads these documents when at least one
 * exists and silently falls back to the built-in content when the list is
 * empty, so the Studio can be filled in gradually.
 *
 * Images are rendered through the Sanity CDN at a fixed 16:9 crop so the
 * front-end layout never has to care about the original aspect ratio.
 */
export const room = defineType({
  name: "room",
  title: "Room type",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "images", title: "Images" },
    { name: "meta", title: "Publishing" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Room name",
      type: "string",
      group: "content",
      validation: (rule) => rule.required().max(70),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      group: "content",
      description: "The room page will live at /rooms/<slug>.",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "short",
      title: "Short name",
      type: "string",
      group: "content",
      description: "Used in labels, e.g. “Balcony”, “Suite”, “Duplex”.",
      validation: (rule) => rule.required().max(30),
    }),
    defineField({
      name: "units",
      title: "How many of this room",
      type: "number",
      group: "content",
      description:
        "Number of identical rooms of this type. The site total is the sum of this field across all published room types.",
      initialValue: 1,
      validation: (rule) => rule.required().min(1).max(200),
    }),
    defineField({
      name: "countLabel",
      title: "Room count label (optional)",
      type: "string",
      group: "content",
      description:
        "Shown on cards, e.g. “9 rooms” or “2 suites”. Leave empty to derive it from the number above.",
      validation: (rule) => rule.max(30),
    }),
    defineField({
      name: "price",
      title: "Nightly rate (INR)",
      type: "number",
      group: "content",
      description: "Base rate in rupees, no commas — e.g. 6000.",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "description",
      title: "Short description",
      type: "text",
      rows: 3,
      group: "content",
      description: "One or two lines used on cards and in social previews.",
      validation: (rule) => rule.required().max(220),
    }),
    defineField({
      name: "long",
      title: "Long description",
      type: "text",
      rows: 5,
      group: "content",
      description: "The main paragraph on the room page.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "note",
      title: "“Good to know” note",
      type: "text",
      rows: 5,
      group: "content",
      description:
        "A rich, unique paragraph shown at the bottom of the room page.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "bestFor",
      title: "Best for",
      type: "string",
      group: "content",
      description: "e.g. “Couples and slow mornings”.",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "amenities",
      title: "Amenities",
      type: "array",
      group: "content",
      of: [{ type: "string" }],
      validation: (rule) => rule.required().min(1).max(12),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
      group: "content",
      description: "Search-result description, max 155 characters.",
      validation: (rule) => rule.required().max(155),
    }),
    defineField({
      name: "mainImage",
      title: "Cover image",
      type: "image",
      group: "images",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (rule) => rule.required(),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "gallery",
      title: "Room gallery",
      type: "array",
      group: "images",
      description:
        "Additional photographs of this room. The cover image is added automatically, so you only need the rest here.",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt text",
              type: "string",
              validation: (rule) => rule.required(),
            }),
          ],
        },
      ],
      validation: (rule) => rule.min(1).max(12),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      group: "meta",
      description: "Lower numbers appear first. Leave empty to sort by name.",
      initialValue: 10,
    }),
    defineField({
      name: "active",
      title: "Show on the website",
      type: "boolean",
      group: "meta",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "displayOrder",
      by: [
        { field: "order", direction: "asc" },
        { field: "name", direction: "asc" },
      ],
    },
  ],
  preview: {
    select: {
      title: "name",
      units: "units",
      price: "price",
      media: "mainImage",
      active: "active",
    },
    prepare({ title, units, price, media, active }) {
      const priceLabel = typeof price === "number" ? `₹${price.toLocaleString("en-IN")}` : "no rate";
      return {
        title: `${active === false ? "✕ " : ""}${title || "Untitled room"}`,
        subtitle: `${units ?? 1} × ${priceLabel} / night`,
        media,
      };
    },
  },
});
