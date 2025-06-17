import { PhoneIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

import { buttonsField, richTextField } from "../common";
import { createCTAPersonalizationFields } from "../definitions/personalization";
import { GROUPS } from "../../utils/constant";

export const cta = defineType({
  name: "cta",
  type: "object",
  icon: PhoneIcon,
  groups: GROUPS,
  fields: [
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      description:
        "The smaller text that sits above the title to provide context",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "The large text that is the primary focus of the block",
    }),
    richTextField,
    buttonsField,
    createCTAPersonalizationFields(),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare: ({ title }) => ({
      title,
      subtitle: "CTA Block",
    }),
  },
});
