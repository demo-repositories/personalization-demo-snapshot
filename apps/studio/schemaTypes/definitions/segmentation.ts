import { Users } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const segmentation = defineType({
  name: 'segmentation',
  title: 'Audience Segmentation',
  type: 'object',
  icon: Users,
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enable Personalization',
      type: 'boolean',
      description: 'Turn on/off personalization for this content',
      initialValue: false,
    }),
    defineField({
      name: 'fallbackContent',
      title: 'Default Content',
      type: 'object',
      description: 'Content shown when no segments match or personalization is disabled',
      fields: [
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
        }),
        defineField({
          name: 'description',
          title: 'Description',
          type: 'text',
          rows: 3,
        }),
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
        }),
        defineField({
          name: 'ctaText',
          title: 'CTA Text',
          type: 'string',
        }),
        defineField({
          name: 'ctaUrl',
          title: 'CTA URL',
          type: 'url',
        }),
      ],
    }),
    defineField({
      name: 'segmentVariants',
      title: 'Personalized Variants',
      type: 'array',
      description: 'Select audience segments and define personalized content for each',
      of: [
        {
          type: 'object',
          name: 'segmentVariant',
          title: 'Segment Variant',
          fields: [
            defineField({
              name: 'segment',
              title: 'Audience Segment',
              type: 'reference',
              to: [{ type: 'segment' }],
              description: 'Select the audience segment for this variant',
              validation: (Rule) => Rule.required(),
              options: {
                filter: ({ document }) => {
                  // Only show active segments
                  return {
                    filter: 'status == "active"',
                    params: {},
                  };
                },
              },
            }),
            defineField({
              name: 'content',
              title: 'Personalized Content',
              type: 'object',
              description: 'Content to show for this segment',
              fields: [
                defineField({
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                }),
                defineField({
                  name: 'description',
                  title: 'Description',
                  type: 'text',
                  rows: 3,
                }),
                defineField({
                  name: 'image',
                  title: 'Image',
                  type: 'image',
                }),
                defineField({
                  name: 'ctaText',
                  title: 'CTA Text',
                  type: 'string',
                }),
                defineField({
                  name: 'ctaUrl',
                  title: 'CTA URL',
                  type: 'url',
                }),
              ],
            }),
          ],
          preview: {
            select: {
              segmentName: 'segment.name',
              title: 'content.title',
              priority: 'segment.priority',
            },
            prepare: ({ segmentName, title, priority }) => ({
              title: `${segmentName || 'No Segment Selected'}`,
              subtitle: `${title ? `Content: ${title}` : 'No content'}${priority ? ` • Priority: ${priority}` : ''}`,
            }),
          },
        },
      ],
    }),
    defineField({
      name: 'testingMode',
      title: 'Testing & Preview',
      type: 'object',
      description: 'Configure testing and preview options',
      fields: [
        defineField({
          name: 'enableTesting',
          title: 'Enable A/B Testing',
          type: 'boolean',
          description: 'Enable split testing between segments',
          initialValue: false,
        }),
        defineField({
          name: 'testingSplit',
          title: 'Traffic Split (%)',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                defineField({
                  name: 'segmentName',
                  title: 'Segment',
                  type: 'string',
                }),
                defineField({
                  name: 'percentage',
                  title: 'Traffic %',
                  type: 'number',
                  validation: (Rule) => Rule.min(0).max(100),
                }),
              ],
            },
          ],
          hidden: ({ parent }) => !parent?.enableTesting,
        }),
        defineField({
          name: 'previewSegment',
          title: 'Preview Segment',
          type: 'string',
          description: 'Select which segment to preview in the studio',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      enabled: 'enabled',
      variantsCount: 'segmentVariants.length',
      hasDefault: 'fallbackContent.title',
    },
    prepare: ({ enabled, variantsCount, hasDefault }) => {
      const status = enabled ? 'Active' : 'Inactive';
      const variants = variantsCount ? `${variantsCount} variants` : 'No variants';
      const fallback = hasDefault ? 'Has default' : 'No default';

      return {
        title: `Personalization: ${status}`,
        subtitle: `${variants} • ${fallback}`,
      };
    },
  },
});

// Predefined attribute suggestions for different categories
export const segmentationAttributes = {
  device: [
    'device_type', // mobile, desktop, tablet
    'operating_system', // iOS, Android, Windows, macOS
    'browser', // Chrome, Safari, Firefox, Edge
    'browser_version',
    'screen_resolution',
    'screen_width',
    'screen_height',
    'user_agent',
    'is_mobile',
    'is_tablet',
    'is_desktop',
  ],
  location: ['country', 'country_code', 'region', 'city', 'timezone', 'language', 'ip_address'],
  behavior: [
    'page_views',
    'session_duration',
    'pages_per_session',
    'bounce_rate',
    'previous_page',
    'referrer',
    'referrer_domain',
    'time_on_page',
    'scroll_depth',
    'clicks',
    'form_submissions',
  ],
  demographics: ['age', 'gender', 'income', 'education', 'job_title', 'company_size', 'industry'],
  traffic: [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'referrer_domain',
    'is_direct_traffic',
    'is_returning_visitor',
    'visit_count',
  ],
  time: [
    'time_of_day',
    'day_of_week',
    'day_of_month',
    'month',
    'season',
    'is_weekend',
    'is_business_hours',
  ],
  custom: [
    'user_id',
    'subscription_status',
    'loyalty_tier',
    'login_status',
    'feature_flags',
    'custom_events',
  ],
};
