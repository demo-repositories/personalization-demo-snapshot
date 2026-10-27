import { Users } from 'lucide-react';
import { defineField, FieldDefinition } from 'sanity';

import { GROUP } from '../../utils/constant';

/**
 * Creates personalization fields for any component
 * @param componentFields - The fields that make up the component content
 * @param componentName - Name of the component (for descriptions)
 * @returns Personalization field definition
 */
export function createPersonalizationFields(
  componentFields: FieldDefinition[],
  componentName: string = 'component',
) {
  return defineField({
    name: 'personalization',
    title: 'Personalization',
    type: 'object',
    icon: Users,
    group: GROUP.PERSONALIZATION,
    description: `Configure different versions of this ${componentName} for different audience segments`,
    fields: [
      defineField({
        name: 'enabled',
        title: 'Enable Personalization',
        type: 'boolean',
        description: `Turn on/off personalization for this ${componentName}. When disabled or no segments match, the regular component content above will be used.`,
        initialValue: false,
      }),
      defineField({
        name: 'variants',
        title: 'Personalized Variants',
        type: 'array',
        description: 'Create different versions for specific audience segments',
        of: [
          {
            type: 'object',
            name: 'personalizedVariant',
            title: 'Personalized Variant',
            fields: [
              defineField({
                name: 'segment',
                title: 'Target Segment',
                type: 'reference',
                to: [{ type: 'segment' }],
                description: 'Select the audience segment for this variant',
                validation: (Rule) => Rule.required(),
                options: {
                  filter: 'status == "active"',
                },
              }),
              defineField({
                name: 'holdoutPercentage',
                title: 'Holdout Percentage',
                type: 'number',
                description: 'Percentage of matching users to show default content instead (0-100)',
                validation: (Rule) => Rule.min(0).max(100),
                initialValue: 0,
              }),
              defineField({
                name: 'content',
                title: 'Personalized Content',
                type: 'object',
                description: 'Content to show for this segment',
                fields: componentFields,
              }),
            ],
            preview: {
              select: {
                segmentName: 'segment.name',
                holdout: 'holdoutPercentage',
                segmentPriority: 'segment.priority',
              },
              prepare: ({ segmentName, holdout, segmentPriority }) => ({
                title: segmentName || 'No Segment Selected',
                subtitle: `${holdout || 0}% holdout${segmentPriority ? ` • Priority: ${segmentPriority}` : ''}`,
              }),
            },
          },
        ],
        hidden: ({ parent }) => !parent?.enabled,
      }),
    ],
    preview: {
      select: {
        enabled: 'enabled',
        variantsCount: 'variants.length',
      },
      prepare: ({ enabled, variantsCount }) => {
        const status = enabled ? 'Active' : 'Inactive';
        const variants = variantsCount ? `${variantsCount} variants` : 'No variants';

        return {
          title: `Personalization: ${status}`,
          subtitle: `${variants} • Uses component content as fallback`,
        };
      },
    },
  });
}

/**
 * Creates hero-specific personalization fields
 */
export function createHeroPersonalizationFields() {
  const heroFields = [
    defineField({
      name: 'badge',
      type: 'string',
      title: 'Badge',
      description: 'Optional badge text displayed above the title',
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'The main heading text for the hero section',
    }),
    defineField({
      name: 'richText',
      type: 'richText',
      title: 'Rich Text',
      description: 'Formatted text content for the hero section',
    }),
    defineField({
      name: 'image',
      type: 'image',
      title: 'Image',
      description: 'The main hero image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'buttons',
      type: 'array',
      title: 'Buttons',
      of: [{ type: 'button' }],
      description: 'Call-to-action buttons',
    }),
  ];

  return createPersonalizationFields(heroFields, 'hero');
}

/**
 * Creates CTA-specific personalization fields
 */
export function createCTAPersonalizationFields() {
  const ctaFields = [
    defineField({
      name: 'eyebrow',
      type: 'string',
      title: 'Eyebrow',
      description: 'Small text that appears above the main title',
    }),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      description: 'The main heading text for the CTA section',
    }),
    defineField({
      name: 'richText',
      type: 'richText',
      title: 'Rich Text',
      description: 'Formatted text content for the CTA section',
    }),
    defineField({
      name: 'buttons',
      type: 'array',
      title: 'Buttons',
      of: [{ type: 'button' }],
      description: 'Call-to-action buttons',
    }),
  ];

  return createPersonalizationFields(ctaFields, 'CTA');
}
