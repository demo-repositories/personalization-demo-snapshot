import { Target } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const segment = defineType({
  name: 'segment',
  title: 'Audience Segment',
  type: 'document',
  icon: Target,
  description: 'Define reusable audience segments for content personalization',
  fields: [
    defineField({
      name: 'name',
      title: 'Segment Name',
      type: 'string',
      description: "Internal name for this segment (e.g., 'Mobile Users', 'First-time Visitors')",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly identifier for this segment',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Brief description of this audience segment and when to use it',
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      description: 'Higher numbers = higher priority when multiple segments match (1-100)',
      initialValue: 50,
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Draft', value: 'draft' },
          { title: 'Archived', value: 'archived' },
        ],
      },
      initialValue: 'active',
      description: 'Current status of this segment',
    }),
    defineField({
      name: 'conditions',
      title: 'Targeting Conditions',
      type: 'object',
      description: 'Define who belongs to this audience segment',
      fields: [
        defineField({
          name: 'operator',
          title: 'Match Logic',
          type: 'string',
          options: {
            list: [
              { title: 'Match ALL conditions (AND)', value: 'and' },
              { title: 'Match ANY condition (OR)', value: 'or' },
            ],
          },
          initialValue: 'and',
          description: 'How to combine multiple targeting rules',
        }),
        defineField({
          name: 'rules',
          title: 'Targeting Rules',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'rule',
              title: 'Rule',
              fields: [
                defineField({
                  name: 'ruleType',
                  title: 'Rule Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Has viewed page', value: 'has_viewed_page' },
                      { title: 'Has performed event', value: 'has_performed_event' },
                      { title: 'Has trait', value: 'has_trait' },
                      { title: 'Is located at', value: 'is_located_at' },
                      { title: 'Is returning visitor', value: 'is_returning_visitor' },
                      { title: 'Is on device', value: 'is_on_device' },
                      { title: 'Visited landing page', value: 'visited_landing_page' },
                      { title: 'Custom attribute', value: 'custom_attribute' },
                    ],
                  },
                  validation: (Rule) => Rule.required(),
                }),
                // Page/URL condition keys
                defineField({
                  name: 'pageConditionKey',
                  title: 'Page Condition',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'URL', value: 'url' },
                      { title: 'Path', value: 'path' },
                      { title: 'Query parameter', value: 'query_parameter' },
                      { title: 'Referrer', value: 'referrer' },
                      { title: 'UTM Campaign', value: 'utm_campaign' },
                      { title: 'UTM Source', value: 'utm_source' },
                      { title: 'UTM Medium', value: 'utm_medium' },
                      { title: 'UTM Term', value: 'utm_term' },
                      { title: 'UTM Content', value: 'utm_content' },
                    ],
                  },
                  description: 'What page attribute to evaluate',
                  hidden: ({ parent }) =>
                    !['has_viewed_page', 'visited_landing_page'].includes(parent?.ruleType),
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (
                        ['has_viewed_page', 'visited_landing_page'].includes(parent?.ruleType) &&
                        !value
                      ) {
                        return 'Page condition is required for this rule type';
                      }
                      return true;
                    }),
                }),

                // Device condition keys
                defineField({
                  name: 'deviceConditionKey',
                  title: 'Device Condition',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Device type', value: 'device_type' },
                      { title: 'Screen size', value: 'screen_size' },
                      { title: 'Operating system', value: 'operating_system' },
                      { title: 'Browser', value: 'browser' },
                    ],
                  },
                  description: 'What device attribute to evaluate',
                  hidden: ({ parent }) => parent?.ruleType !== 'is_on_device',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'is_on_device' && !value) {
                        return 'Device condition is required for this rule type';
                      }
                      return true;
                    }),
                }),

                // Location condition keys
                defineField({
                  name: 'locationConditionKey',
                  title: 'Location Condition',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Country', value: 'country' },
                      { title: 'Region/State', value: 'region' },
                      { title: 'City', value: 'city' },
                      { title: 'Postal code', value: 'postal_code' },
                      { title: 'Continent', value: 'continent' },
                    ],
                  },
                  description: 'What location attribute to evaluate',
                  hidden: ({ parent }) => parent?.ruleType !== 'is_located_at',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'is_located_at' && !value) {
                        return 'Location condition is required for this rule type';
                      }
                      return true;
                    }),
                }),

                // Event condition keys
                defineField({
                  name: 'eventConditionKey',
                  title: 'Event Condition',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Event name', value: 'event_name' },
                      { title: 'Event property', value: 'event_property' },
                      { title: 'Event count', value: 'event_count' },
                    ],
                  },
                  description: 'What event attribute to evaluate',
                  hidden: ({ parent }) => parent?.ruleType !== 'has_performed_event',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'has_performed_event' && !value) {
                        return 'Event condition is required for this rule type';
                      }
                      return true;
                    }),
                }),

                // Trait condition keys
                defineField({
                  name: 'traitConditionKey',
                  title: 'Trait Condition',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'User attribute', value: 'user_attribute' },
                      { title: 'Custom property', value: 'custom_property' },
                      { title: 'User ID', value: 'user_id' },
                      { title: 'Email domain', value: 'email_domain' },
                    ],
                  },
                  description: 'What user trait to evaluate',
                  hidden: ({ parent }) => parent?.ruleType !== 'has_trait',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'has_trait' && !value) {
                        return 'Trait condition is required for this rule type';
                      }
                      return true;
                    }),
                }),

                // Visitor condition keys
                defineField({
                  name: 'visitorConditionKey',
                  title: 'Visitor Condition',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Session count', value: 'session_count' },
                      { title: 'Page views', value: 'page_views' },
                      { title: 'Time on site', value: 'time_on_site' },
                      { title: 'Last visit', value: 'last_visit' },
                    ],
                  },
                  description: 'What visitor attribute to evaluate',
                  hidden: ({ parent }) => parent?.ruleType !== 'is_returning_visitor',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'is_returning_visitor' && !value) {
                        return 'Visitor condition is required for this rule type';
                      }
                      return true;
                    }),
                }),

                // Custom condition keys
                defineField({
                  name: 'customConditionKey',
                  title: 'Custom Condition',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Custom property', value: 'custom_property' },
                      { title: 'User attribute', value: 'user_attribute' },
                      { title: 'Session data', value: 'session_data' },
                      { title: 'Local storage', value: 'local_storage' },
                    ],
                  },
                  description: 'What custom attribute to evaluate',
                  hidden: ({ parent }) => parent?.ruleType !== 'custom_attribute',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'custom_attribute' && !value) {
                        return 'Custom condition is required for this rule type';
                      }
                      return true;
                    }),
                }),
                // Page/URL operators
                defineField({
                  name: 'pageOperator',
                  title: 'Page Operator',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'equals', value: 'equals' },
                      { title: 'does not equal', value: 'does_not_equal' },
                      { title: 'contains', value: 'contains' },
                      { title: 'does not contain', value: 'does_not_contain' },
                      { title: 'starts with', value: 'starts_with' },
                      { title: 'ends with', value: 'ends_with' },
                      { title: 'matches (regex)', value: 'matches' },
                      { title: 'exists', value: 'exists' },
                      { title: 'does not exist', value: 'does_not_exist' },
                    ],
                  },
                  hidden: ({ parent }) =>
                    !['has_viewed_page', 'visited_landing_page'].includes(parent?.ruleType),
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (
                        ['has_viewed_page', 'visited_landing_page'].includes(parent?.ruleType) &&
                        !value
                      ) {
                        return 'Operator is required';
                      }
                      return true;
                    }),
                }),

                // Device operators
                defineField({
                  name: 'deviceOperator',
                  title: 'Device Operator',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'equals', value: 'equals' },
                      { title: 'does not equal', value: 'does_not_equal' },
                      { title: 'is in', value: 'in' },
                      { title: 'is not in', value: 'not_in' },
                    ],
                  },
                  hidden: ({ parent }) => parent?.ruleType !== 'is_on_device',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'is_on_device' && !value) {
                        return 'Operator is required';
                      }
                      return true;
                    }),
                }),

                // Location operators
                defineField({
                  name: 'locationOperator',
                  title: 'Location Operator',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'equals', value: 'equals' },
                      { title: 'does not equal', value: 'does_not_equal' },
                      { title: 'is in', value: 'in' },
                      { title: 'is not in', value: 'not_in' },
                      { title: 'near', value: 'near' },
                      { title: 'within', value: 'within' },
                    ],
                  },
                  hidden: ({ parent }) => parent?.ruleType !== 'is_located_at',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'is_located_at' && !value) {
                        return 'Operator is required';
                      }
                      return true;
                    }),
                }),

                // Event operators
                defineField({
                  name: 'eventOperator',
                  title: 'Event Operator',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'equals', value: 'equals' },
                      { title: 'does not equal', value: 'does_not_equal' },
                      { title: 'contains', value: 'contains' },
                      { title: 'greater than', value: 'greater_than' },
                      { title: 'less than', value: 'less_than' },
                      { title: 'happened within', value: 'happened_within' },
                      { title: 'happened before', value: 'happened_before' },
                      { title: 'happened after', value: 'happened_after' },
                    ],
                  },
                  hidden: ({ parent }) => parent?.ruleType !== 'has_performed_event',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'has_performed_event' && !value) {
                        return 'Operator is required';
                      }
                      return true;
                    }),
                }),

                // Trait operators
                defineField({
                  name: 'traitOperator',
                  title: 'Trait Operator',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'equals', value: 'equals' },
                      { title: 'does not equal', value: 'does_not_equal' },
                      { title: 'contains', value: 'contains' },
                      { title: 'does not contain', value: 'does_not_contain' },
                      { title: 'starts with', value: 'starts_with' },
                      { title: 'ends with', value: 'ends_with' },
                      { title: 'is in', value: 'in' },
                      { title: 'is not in', value: 'not_in' },
                      { title: 'exists', value: 'exists' },
                      { title: 'does not exist', value: 'does_not_exist' },
                    ],
                  },
                  hidden: ({ parent }) => parent?.ruleType !== 'has_trait',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'has_trait' && !value) {
                        return 'Operator is required';
                      }
                      return true;
                    }),
                }),

                // Visitor operators
                defineField({
                  name: 'visitorOperator',
                  title: 'Visitor Operator',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'equals', value: 'equals' },
                      { title: 'greater than', value: 'greater_than' },
                      { title: 'less than', value: 'less_than' },
                      { title: 'greater than or equal to', value: 'greater_than_or_equal' },
                      { title: 'less than or equal to', value: 'less_than_or_equal' },
                      { title: 'happened within', value: 'happened_within' },
                    ],
                  },
                  hidden: ({ parent }) => parent?.ruleType !== 'is_returning_visitor',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'is_returning_visitor' && !value) {
                        return 'Operator is required';
                      }
                      return true;
                    }),
                }),

                // Custom operators
                defineField({
                  name: 'customOperator',
                  title: 'Custom Operator',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'equals', value: 'equals' },
                      { title: 'does not equal', value: 'does_not_equal' },
                      { title: 'contains', value: 'contains' },
                      { title: 'does not contain', value: 'does_not_contain' },
                      { title: 'greater than', value: 'greater_than' },
                      { title: 'less than', value: 'less_than' },
                      { title: 'is in', value: 'in' },
                      { title: 'is not in', value: 'not_in' },
                      { title: 'exists', value: 'exists' },
                      { title: 'does not exist', value: 'does_not_exist' },
                    ],
                  },
                  hidden: ({ parent }) => parent?.ruleType !== 'custom_attribute',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as any;
                      if (parent?.ruleType === 'custom_attribute' && !value) {
                        return 'Operator is required';
                      }
                      return true;
                    }),
                }),
                defineField({
                  name: 'value',
                  title: 'Value',
                  type: 'string',
                  description: 'The value to compare against',
                  hidden: ({ parent }) => {
                    const operators = [
                      parent?.pageOperator,
                      parent?.deviceOperator,
                      parent?.locationOperator,
                      parent?.eventOperator,
                      parent?.traitOperator,
                      parent?.visitorOperator,
                      parent?.customOperator,
                    ].filter(Boolean);

                    const currentOperator = operators[0];
                    return (
                      ['exists', 'does_not_exist'].includes(currentOperator) || !parent?.ruleType
                    );
                  },
                }),
                defineField({
                  name: 'values',
                  title: 'Values List',
                  type: 'array',
                  of: [{ type: 'string' }],
                  description: 'Multiple values for list operations',
                  hidden: ({ parent }) => {
                    const operators = [
                      parent?.pageOperator,
                      parent?.deviceOperator,
                      parent?.locationOperator,
                      parent?.eventOperator,
                      parent?.traitOperator,
                      parent?.visitorOperator,
                      parent?.customOperator,
                    ].filter(Boolean);

                    const currentOperator = operators[0];
                    return !['in', 'not_in'].includes(currentOperator);
                  },
                }),
                defineField({
                  name: 'deviceType',
                  title: 'Device Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Desktop', value: 'desktop' },
                      { title: 'Mobile', value: 'mobile' },
                      { title: 'Tablet', value: 'tablet' },
                    ],
                  },
                  description: 'Select device type',
                  hidden: ({ parent }) => parent?.deviceConditionKey !== 'device_type',
                }),
                defineField({
                  name: 'locationType',
                  title: 'Location Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Continent', value: 'continent' },
                      { title: 'Country', value: 'country' },
                      { title: 'Region/State', value: 'region' },
                      { title: 'City', value: 'city' },
                      { title: 'Postal Code', value: 'postal_code' },
                    ],
                  },
                  description: 'Geographic scope for location-based targeting',
                  hidden: ({ parent }) =>
                    !['country', 'region', 'city', 'postal_code', 'continent'].includes(
                      parent?.locationConditionKey,
                    ),
                }),
                defineField({
                  name: 'timeAmount',
                  title: 'Time Amount',
                  type: 'number',
                  description: 'Number for time-based conditions',
                  hidden: ({ parent }) => {
                    const operators = [
                      parent?.pageOperator,
                      parent?.eventOperator,
                      parent?.visitorOperator,
                    ].filter(Boolean);

                    const currentOperator = operators[0];
                    return !['happened_within', 'happened_before', 'happened_after'].includes(
                      currentOperator,
                    );
                  },
                  validation: (Rule) => Rule.min(1),
                }),
                defineField({
                  name: 'timeUnit',
                  title: 'Time Unit',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Minutes', value: 'minutes' },
                      { title: 'Hours', value: 'hours' },
                      { title: 'Days', value: 'days' },
                      { title: 'Weeks', value: 'weeks' },
                      { title: 'Months', value: 'months' },
                      { title: 'Years', value: 'years' },
                    ],
                  },
                  description: 'Time unit for time-based conditions',
                  hidden: ({ parent }) => {
                    const operators = [
                      parent?.pageOperator,
                      parent?.eventOperator,
                      parent?.visitorOperator,
                    ].filter(Boolean);

                    const currentOperator = operators[0];
                    return !['happened_within', 'happened_before', 'happened_after'].includes(
                      currentOperator,
                    );
                  },
                }),
                defineField({
                  name: 'coordinates',
                  title: 'Coordinates',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'latitude',
                      title: 'Latitude',
                      type: 'number',
                      validation: (Rule) => Rule.min(-90).max(90),
                    }),
                    defineField({
                      name: 'longitude',
                      title: 'Longitude',
                      type: 'number',
                      validation: (Rule) => Rule.min(-180).max(180),
                    }),
                    defineField({
                      name: 'radius',
                      title: 'Radius (km)',
                      type: 'number',
                      description: 'Radius in kilometers for proximity search',
                      validation: (Rule) => Rule.min(0),
                    }),
                  ],
                  description: 'Geographic coordinates for location-based targeting',
                  hidden: ({ parent }) => !['near', 'within'].includes(parent?.locationOperator),
                }),
                defineField({
                  name: 'customKey',
                  title: 'Custom Property Key',
                  type: 'string',
                  description: 'The name of the custom property to evaluate',
                  hidden: ({ parent }) =>
                    !['custom_property'].includes(
                      parent?.traitConditionKey || parent?.customConditionKey,
                    ),
                }),
                defineField({
                  name: 'queryParameterKey',
                  title: 'Query Parameter Name',
                  type: 'string',
                  description: "The name of the URL query parameter (e.g., 'utm_source', 'ref')",
                  hidden: ({ parent }) => parent?.pageConditionKey !== 'query_parameter',
                }),
              ],
              preview: {
                select: {
                  ruleType: 'ruleType',
                  pageConditionKey: 'pageConditionKey',
                  deviceConditionKey: 'deviceConditionKey',
                  locationConditionKey: 'locationConditionKey',
                  eventConditionKey: 'eventConditionKey',
                  traitConditionKey: 'traitConditionKey',
                  visitorConditionKey: 'visitorConditionKey',
                  customConditionKey: 'customConditionKey',
                  pageOperator: 'pageOperator',
                  deviceOperator: 'deviceOperator',
                  locationOperator: 'locationOperator',
                  eventOperator: 'eventOperator',
                  traitOperator: 'traitOperator',
                  visitorOperator: 'visitorOperator',
                  customOperator: 'customOperator',
                  value: 'value',
                  deviceType: 'deviceType',
                },
                prepare: (selection) => {
                  const {
                    ruleType,
                    pageConditionKey,
                    deviceConditionKey,
                    locationConditionKey,
                    eventConditionKey,
                    traitConditionKey,
                    visitorConditionKey,
                    customConditionKey,
                    pageOperator,
                    deviceOperator,
                    locationOperator,
                    eventOperator,
                    traitOperator,
                    visitorOperator,
                    customOperator,
                    value,
                    deviceType,
                  } = selection;

                  // Get the active condition and operator based on rule type
                  const conditionKey =
                    pageConditionKey ||
                    deviceConditionKey ||
                    locationConditionKey ||
                    eventConditionKey ||
                    traitConditionKey ||
                    visitorConditionKey ||
                    customConditionKey;

                  const operator =
                    pageOperator ||
                    deviceOperator ||
                    locationOperator ||
                    eventOperator ||
                    traitOperator ||
                    visitorOperator ||
                    customOperator;

                  const displayValue = deviceType || value || '';
                  const ruleTypeLabel = ruleType?.replace(/_/g, ' ') || 'Rule';
                  const conditionLabel = conditionKey?.replace(/_/g, ' ') || 'condition';
                  const operatorLabel = operator?.replace(/_/g, ' ') || '';

                  return {
                    title: `${ruleTypeLabel}: ${conditionLabel} ${operatorLabel} ${displayValue}`,
                    subtitle: `${ruleType || 'rule'}`,
                  };
                },
              },
            },
          ],
          validation: (Rule) => Rule.min(1).error('At least one targeting rule is required'),
        }),
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Tags to help organize and find segments',
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      rows: 3,
      description: 'Internal notes about this segment for your team',
    }),
    defineField({
      name: 'estimatedSize',
      title: 'Estimated Audience Size',
      type: 'string',
      options: {
        list: [
          { title: 'Very Small (< 1%)', value: 'very-small' },
          { title: 'Small (1-5%)', value: 'small' },
          { title: 'Medium (5-20%)', value: 'medium' },
          { title: 'Large (20-50%)', value: 'large' },
          { title: 'Very Large (> 50%)', value: 'very-large' },
          { title: 'Unknown', value: 'unknown' },
        ],
      },
      initialValue: 'unknown',
      description: 'Rough estimate of how many users match this segment',
    }),
  ],
  preview: {
    select: {
      name: 'name',
      description: 'description',
      priority: 'priority',
      status: 'status',
      rulesCount: 'conditions.rules.length',
      estimatedSize: 'estimatedSize',
    },
    prepare: ({ name, description, priority, status, rulesCount, estimatedSize }) => {
      const statusEmojiMap = {
        active: '🟢',
        draft: '🟡',
        archived: '🔴',
      } as const;

      const sizeEmojiMap = {
        'very-small': '🔹',
        small: '🔸',
        medium: '🟠',
        large: '🟡',
        'very-large': '🔴',
        unknown: '❓',
      } as const;

      const statusEmoji = statusEmojiMap[status as keyof typeof statusEmojiMap] || '⚪';
      const sizeEmoji = sizeEmojiMap[estimatedSize as keyof typeof sizeEmojiMap] || '❓';

      return {
        title: `${statusEmoji} ${name || 'Unnamed Segment'}`,
        subtitle: `Priority: ${priority} • ${rulesCount || 0} rules • ${sizeEmoji} ${estimatedSize?.replace('-', ' ') || 'unknown'} audience${description ? ` • ${description}` : ''}`,
      };
    },
  },
  orderings: [
    {
      title: 'Priority (High to Low)',
      name: 'priorityDesc',
      by: [{ field: 'priority', direction: 'desc' }],
    },
    {
      title: 'Status',
      name: 'status',
      by: [{ field: 'status', direction: 'asc' }],
    },
    {
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
});
