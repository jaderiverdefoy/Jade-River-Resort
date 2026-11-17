import { defineField, defineType } from "sanity";

/**
 * An experience shown on the homepage rail and on /experiences. Falls back to
 * the built-in list until at least one document is published.
 */
export const experience = defineType({
  name: "experience",
  title: "Experience",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required().max(70),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "string",
      description: "One short line under the title.",
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: "body",
      title: "Description",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required().max(400),
    }),
    defineField({
      name: "meta",
      title: "Meta line",
      type: "string",
      description: "e.g. “Every clear evening · Riverside”.",
      validation: (rule) => rule.required().max(80),
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
          validation: (rule) => rule.required().max(160),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
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
    select: { title: "title", subtitle: "meta", media: "image" },
  },
});
