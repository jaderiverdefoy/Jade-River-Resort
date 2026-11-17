import { author } from "./author";
import { blockContent } from "./blockContent";
import { calloutBlock } from "./blocks/calloutBlock";
import { ctaButtonBlock } from "./blocks/ctaButtonBlock";
import { htmlBlock } from "./blocks/htmlBlock";
import { tableBlock } from "./blocks/tableBlock";
import { category } from "./category";
import { experience } from "./experience";
import { galleryImage } from "./galleryImage";
import { post } from "./post";
import { review } from "./review";
import { room } from "./room";

export const schemaTypes = [
  post,
  room,
  galleryImage,
  experience,
  review,
  author,
  category,
  blockContent,
  tableBlock,
  ctaButtonBlock,
  calloutBlock,
  htmlBlock,
];
