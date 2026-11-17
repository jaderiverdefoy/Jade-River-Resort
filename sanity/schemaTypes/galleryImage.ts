import { defineField, defineType } from "sanity";

/**
 * A single photograph on /gallery. Documents are ordered by `order`, then by
 * the upload date. The gallery page falls back to the built-in photographs
 * until at least one image is published here.
 */
export const galleryImage = defineType({
  name: "galleryImage",
  title: "Gallery photograph",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Internal title",
      type: "string",
      description: "Only used inside the Studio to find the photo again.",
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: "image",
      title: "Photograph",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          description:
            "Describe the photo for screen readers and search engines. Required.",
          validation: (rule) => rule.required().max(160),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "span",
      title: "Tile shape",
      type: "string",
      initialValue: "wide",
      options: {
        layout: "radio",
        list: [
          { title: "Wide (4:3)", value: "wide" },
          { title: "Square", value: "std" },
          { title: "Tall (3:4)", value: "tall" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first.",
      initialValue: 10,
    }),
    defineField({
      name: "active",
      title: "Show on the website",
      type: "boolean",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "displayOrder",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", alt: "image.alt", media: "image", span: "span" },
    prepare({ title, alt, media, span }) {
      return {
        title: title || alt || "Gallery photograph",
        subtitle: `${span || "wide"}${alt ? ` · ${alt}` : ""}`,
        media,
      };
    },
  },
});
