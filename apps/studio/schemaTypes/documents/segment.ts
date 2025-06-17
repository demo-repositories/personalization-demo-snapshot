import { Target } from "lucide-react";
import { defineField, defineType } from "sanity";

export const segment = defineType({
  name: "segment",
  title: "Audience Segment",
  type: "document",
  icon: Target,
  description: "Define reusable audience segments for content personalization",
  fields: [
    defineField({
      name: "name",
      title: "Segment Name",
      type: "string",
      description: "Internal name for this segment (e.g., 'Mobile Users', 'First-time Visitors')",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "URL-friendly identifier for this segment",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
      description: "Brief description of this audience segment and when to use it",
    }),
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      description: "Higher numbers = higher priority when multiple segments match (1-100)",
      initialValue: 50,
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Active", value: "active" },
          { title: "Draft", value: "draft" },
          { title: "Archived", value: "archived" },
        ],
      },
      initialValue: "active",
      description: "Current status of this segment",
    }),
    defineField({
      name: "conditions",
      title: "Targeting Conditions",
      type: "object",
      description: "Define who belongs to this audience segment",
      fields: [
        defineField({
          name: "operator",
          title: "Match Logic",
          type: "string",
          options: {
            list: [
              { title: "Match ALL conditions (AND)", value: "and" },
              { title: "Match ANY condition (OR)", value: "or" },
            ],
          },
          initialValue: "and",
          description: "How to combine multiple targeting rules",
        }),
        defineField({
          name: "rules",
          title: "Targeting Rules",
          type: "array",
          of: [
            {
              type: "object",
              name: "rule",
              title: "Rule",
              fields: [
                defineField({
                  name: "category",
                  title: "Category",
                  type: "string",
                  options: {
                    list: [
                      { title: "Device & Technology", value: "device" },
                      { title: "Location & Geography", value: "location" },
                      { title: "Behavior & Engagement", value: "behavior" },
                      { title: "Demographics", value: "demographics" },
                      { title: "Traffic Source", value: "traffic" },
                      { title: "Time & Date", value: "time" },
                      { title: "Custom Attributes", value: "custom" },
                    ],
                  },
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: "attribute",
                  title: "Attribute",
                  type: "string",
                  description: "The specific attribute to target",
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: "operator",
                  title: "Condition",
                  type: "string",
                  options: {
                    list: [
                      { title: "equals", value: "eq" },
                      { title: "does not equal", value: "neq" },
                      { title: "contains", value: "contains" },
                      { title: "does not contain", value: "not_contains" },
                      { title: "starts with", value: "starts_with" },
                      { title: "ends with", value: "ends_with" },
                      { title: "matches regex", value: "regex" },
                      { title: "greater than", value: "gt" },
                      { title: "less than", value: "lt" },
                      { title: "greater than or equal", value: "gte" },
                      { title: "less than or equal", value: "lte" },
                      { title: "between (inclusive)", value: "between" },
                      { title: "not between", value: "not_between" },
                      { title: "is empty", value: "empty" },
                      { title: "is not empty", value: "not_empty" },
                      { title: "is in list", value: "in" },
                      { title: "is not in list", value: "not_in" },
                      { title: "happened in last X days", value: "last_days" },
                      { title: "happened more than X days ago", value: "more_than_days" },
                      { title: "happened exactly X times", value: "count_eq" },
                      { title: "happened more than X times", value: "count_gt" },
                      { title: "happened less than X times", value: "count_lt" },
                    ],
                  },
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: "value",
                  title: "Value",
                  type: "string",
                  description: "The value to compare against (leave empty for 'is empty' conditions)",
                }),
                defineField({
                  name: "values",
                  title: "Values List",
                  type: "array",
                  of: [{ type: "string" }],
                  description: "Multiple values for 'in list' conditions",
                  hidden: ({ parent }) => !["in", "not_in"].includes(parent?.operator),
                }),
                defineField({
                  name: "rangeStart",
                  title: "Range Start",
                  type: "string",
                  description: "Start value for range conditions (between, not_between)",
                  hidden: ({ parent }) => !["between", "not_between"].includes(parent?.operator),
                }),
                defineField({
                  name: "rangeEnd",
                  title: "Range End",
                  type: "string",
                  description: "End value for range conditions (between, not_between)",
                  hidden: ({ parent }) => !["between", "not_between"].includes(parent?.operator),
                }),
                defineField({
                  name: "daysValue",
                  title: "Number of Days",
                  type: "number",
                  description: "Number of days for time-based conditions",
                  hidden: ({ parent }) => !["last_days", "more_than_days"].includes(parent?.operator),
                  validation: (Rule) => Rule.min(1),
                }),
                defineField({
                  name: "countValue",
                  title: "Count",
                  type: "number",
                  description: "Number of occurrences for count-based conditions",
                  hidden: ({ parent }) => !["count_eq", "count_gt", "count_lt"].includes(parent?.operator),
                  validation: (Rule) => Rule.min(0),
                }),
              ],
              preview: {
                select: {
                  category: "category",
                  attribute: "attribute",
                  operator: "operator",
                  value: "value",
                },
                prepare: ({ category, attribute, operator, value }) => ({
                  title: `${attribute || "Attribute"} ${operator || "condition"} ${value || ""}`,
                  subtitle: category || "Rule",
                }),
              },
            },
          ],
          validation: (Rule) => Rule.min(1).error("At least one targeting rule is required"),
        }),
      ],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      description: "Tags to help organize and find segments",
      options: {
        layout: "tags",
      },
    }),
    defineField({
      name: "notes",
      title: "Internal Notes",
      type: "text",
      rows: 3,
      description: "Internal notes about this segment for your team",
    }),
    defineField({
      name: "estimatedSize",
      title: "Estimated Audience Size",
      type: "string",
      options: {
        list: [
          { title: "Very Small (< 1%)", value: "very-small" },
          { title: "Small (1-5%)", value: "small" },
          { title: "Medium (5-20%)", value: "medium" },
          { title: "Large (20-50%)", value: "large" },
          { title: "Very Large (> 50%)", value: "very-large" },
          { title: "Unknown", value: "unknown" },
        ],
      },
      initialValue: "unknown",
      description: "Rough estimate of how many users match this segment",
    }),
  ],
  preview: {
    select: {
      name: "name",
      description: "description",
      priority: "priority",
      status: "status",
      rulesCount: "conditions.rules.length",
      estimatedSize: "estimatedSize",
    },
    prepare: ({ name, description, priority, status, rulesCount, estimatedSize }) => {
      const statusEmojiMap = {
        active: "🟢",
        draft: "🟡",
        archived: "🔴",
      } as const;

      const sizeEmojiMap = {
        "very-small": "🔹",
        small: "🔸",
        medium: "🟠",
        large: "🟡",
        "very-large": "🔴",
        unknown: "❓",
      } as const;

      const statusEmoji = statusEmojiMap[status as keyof typeof statusEmojiMap] || "⚪";
      const sizeEmoji = sizeEmojiMap[estimatedSize as keyof typeof sizeEmojiMap] || "❓";

      return {
        title: `${statusEmoji} ${name || "Unnamed Segment"}`,
        subtitle: `Priority: ${priority} • ${rulesCount || 0} rules • ${sizeEmoji} ${estimatedSize?.replace("-", " ") || "unknown"} audience${description ? ` • ${description}` : ""}`,
      };
    },
  },
  orderings: [
    {
      title: "Priority (High to Low)",
      name: "priorityDesc",
      by: [{ field: "priority", direction: "desc" }],
    },
    {
      title: "Status",
      name: "status",
      by: [{ field: "status", direction: "asc" }],
    },
    {
      title: "Name A-Z",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
}); 