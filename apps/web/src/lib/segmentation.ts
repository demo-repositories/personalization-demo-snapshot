/**
 * Segmentation utilities for handling personalized content
 * This module provides functions to evaluate segmentation rules and deliver personalized content
 */

export interface SegmentationRule {
  category: string;
  attribute: string;
  operator: string;
  value?: string;
  values?: string[];
  rangeStart?: string;
  rangeEnd?: string;
  daysValue?: number;
  countValue?: number;
}

export interface SegmentationConditions {
  operator: 'and' | 'or';
  rules: SegmentationRule[];
}

export interface Segment {
  _id: string;
  name: string;
  slug: { current: string };
  description?: string;
  priority: number;
  status: 'active' | 'draft' | 'archived';
  conditions: SegmentationConditions;
  tags?: string[];
  notes?: string;
  estimatedSize?: string;
}

export interface SegmentVariant {
  segment: Segment;
  content: {
    title?: string;
    description?: string;
    image?: any;
    ctaText?: string;
    ctaUrl?: string;
  };
}

export interface SegmentationData {
  enabled: boolean;
  fallbackContent: {
    title?: string;
    description?: string;
    image?: any;
    ctaText?: string;
    ctaUrl?: string;
  };
  segmentVariants: SegmentVariant[];
  testingMode?: {
    enableTesting: boolean;
    testingSplit?: Array<{ segmentName: string; percentage: number }>;
    previewSegment?: string;
  };
}

export interface UserContext {
  // Device & Technology
  device_type?: string;
  operating_system?: string;
  browser?: string;
  browser_version?: string;
  screen_resolution?: string;
  screen_width?: number;
  screen_height?: number;
  user_agent?: string;
  is_mobile?: boolean;
  is_tablet?: boolean;
  is_desktop?: boolean;

  // Location & Geography
  country?: string;
  country_code?: string;
  region?: string;
  city?: string;
  timezone?: string;
  language?: string;
  ip_address?: string;

  // Behavior & Engagement
  page_views?: number;
  session_duration?: number;
  pages_per_session?: number;
  bounce_rate?: number;
  previous_page?: string;
  referrer?: string;
  referrer_domain?: string;
  time_on_page?: number;
  scroll_depth?: number;
  clicks?: number;
  form_submissions?: number;

  // Demographics
  age?: number;
  gender?: string;
  income?: number;
  education?: string;
  job_title?: string;
  company_size?: string;
  industry?: string;

  // Traffic Source
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  is_direct_traffic?: boolean;
  is_returning_visitor?: boolean;
  visit_count?: number;

  // Time & Date
  time_of_day?: number;
  day_of_week?: number;
  day_of_month?: number;
  month?: number;
  season?: string;
  is_weekend?: boolean;
  is_business_hours?: boolean;

  // Custom Attributes
  user_id?: string;
  subscription_status?: string;
  loyalty_tier?: string;
  login_status?: boolean;
  feature_flags?: Record<string, boolean>;
  custom_events?: string[];
}

/**
 * Evaluates a single segmentation rule against user context
 */
export function evaluateRule(rule: SegmentationRule, context: UserContext): boolean {
  const { attribute, operator, value, values, rangeStart, rangeEnd, daysValue, countValue } = rule;
  const contextValue = context[attribute as keyof UserContext];

  switch (operator) {
    case 'eq':
      return contextValue === value;

    case 'neq':
      return contextValue !== value;

    case 'contains':
      return typeof contextValue === 'string' && typeof value === 'string'
        ? contextValue.toLowerCase().includes(value.toLowerCase())
        : false;

    case 'not_contains':
      return typeof contextValue === 'string' && typeof value === 'string'
        ? !contextValue.toLowerCase().includes(value.toLowerCase())
        : true;

    case 'starts_with':
      return typeof contextValue === 'string' && typeof value === 'string'
        ? contextValue.toLowerCase().startsWith(value.toLowerCase())
        : false;

    case 'ends_with':
      return typeof contextValue === 'string' && typeof value === 'string'
        ? contextValue.toLowerCase().endsWith(value.toLowerCase())
        : false;

    case 'regex':
      if (typeof contextValue === 'string' && typeof value === 'string') {
        try {
          const regex = new RegExp(value, 'i');
          return regex.test(contextValue);
        } catch {
          return false;
        }
      }
      return false;

    case 'gt':
      return typeof contextValue === 'number' && typeof value === 'string'
        ? contextValue > parseFloat(value)
        : false;

    case 'lt':
      return typeof contextValue === 'number' && typeof value === 'string'
        ? contextValue < parseFloat(value)
        : false;

    case 'gte':
      return typeof contextValue === 'number' && typeof value === 'string'
        ? contextValue >= parseFloat(value)
        : false;

    case 'lte':
      return typeof contextValue === 'number' && typeof value === 'string'
        ? contextValue <= parseFloat(value)
        : false;

    case 'between':
      if (typeof contextValue === 'number' && rangeStart && rangeEnd) {
        const start = parseFloat(rangeStart);
        const end = parseFloat(rangeEnd);
        return contextValue >= start && contextValue <= end;
      }
      if (typeof contextValue === 'string' && rangeStart && rangeEnd) {
        return contextValue >= rangeStart && contextValue <= rangeEnd;
      }
      return false;

    case 'not_between':
      if (typeof contextValue === 'number' && rangeStart && rangeEnd) {
        const start = parseFloat(rangeStart);
        const end = parseFloat(rangeEnd);
        return contextValue < start || contextValue > end;
      }
      if (typeof contextValue === 'string' && rangeStart && rangeEnd) {
        return contextValue < rangeStart || contextValue > rangeEnd;
      }
      return true;

    case 'empty':
      return contextValue === undefined || contextValue === null || contextValue === '';

    case 'not_empty':
      return contextValue !== undefined && contextValue !== null && contextValue !== '';

    case 'in':
      return values ? values.includes(String(contextValue)) : false;

    case 'not_in':
      return values ? !values.includes(String(contextValue)) : true;

    case 'last_days':
      if (typeof contextValue === 'string' && daysValue) {
        try {
          const targetDate = new Date(contextValue);
          const now = new Date();
          const diffTime = now.getTime() - targetDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= daysValue;
        } catch {
          return false;
        }
      }
      return false;

    case 'more_than_days':
      if (typeof contextValue === 'string' && daysValue) {
        try {
          const targetDate = new Date(contextValue);
          const now = new Date();
          const diffTime = now.getTime() - targetDate.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays > daysValue;
        } catch {
          return false;
        }
      }
      return false;

    case 'count_eq':
      return typeof contextValue === 'number' && countValue !== undefined
        ? contextValue === countValue
        : false;

    case 'count_gt':
      return typeof contextValue === 'number' && countValue !== undefined
        ? contextValue > countValue
        : false;

    case 'count_lt':
      return typeof contextValue === 'number' && countValue !== undefined
        ? contextValue < countValue
        : false;

    default:
      return false;
  }
}

/**
 * Evaluates segmentation conditions (multiple rules with AND/OR logic)
 */
export function evaluateConditions(
  conditions: SegmentationConditions,
  context: UserContext,
): boolean {
  const { operator, rules } = conditions;

  if (!rules || rules.length === 0) {
    return true;
  }

  const results = rules.map((rule) => evaluateRule(rule, context));

  return operator === 'and' ? results.every((result) => result) : results.some((result) => result);
}

/**
 * Finds the best matching segment variant for a user context
 */
export function findMatchingSegmentVariant(
  segmentVariants: SegmentVariant[],
  context: UserContext,
): SegmentVariant | null {
  const matchingVariants = segmentVariants
    .filter(
      (variant) =>
        variant.segment.status === 'active' &&
        evaluateConditions(variant.segment.conditions, context),
    )
    .sort((a, b) => b.segment.priority - a.segment.priority);

  return matchingVariants[0] || null;
}

/**
 * Gets personalized content based on segmentation rules
 */
export function getPersonalizedContent(
  segmentationData: SegmentationData,
  context: UserContext,
  previewSegment?: string,
): any {
  if (!segmentationData.enabled) {
    return segmentationData.fallbackContent;
  }

  if (previewSegment) {
    const variant = segmentationData.segmentVariants.find((v) => v.segment.name === previewSegment);
    if (variant) {
      return variant.content;
    }
  }

  const matchingVariant = findMatchingSegmentVariant(segmentationData.segmentVariants, context);

  if (matchingVariant) {
    return matchingVariant.content;
  }

  return segmentationData.fallbackContent;
}

/**
 * Creates user context from browser environment (for client-side)
 */
export function createUserContextFromBrowser(): UserContext {
  if (typeof window === 'undefined') {
    return {};
  }

  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const screen = window.screen;

  // Device detection
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
  const isTablet = /iPad|Tablet/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  // Browser detection with version
  let browser = 'unknown';
  let browserVersion = '';
  if (userAgent.includes('Chrome')) {
    browser = 'chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Firefox')) {
    browser = 'firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Safari')) {
    browser = 'safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    browserVersion = match ? match[1] : '';
  } else if (userAgent.includes('Edge')) {
    browser = 'edge';
    const match = userAgent.match(/Edge\/([0-9.]+)/);
    browserVersion = match ? match[1] : '';
  }

  let operatingSystem = 'unknown';
  if (userAgent.includes('Windows')) operatingSystem = 'windows';
  else if (userAgent.includes('Mac')) operatingSystem = 'macos';
  else if (userAgent.includes('Linux')) operatingSystem = 'linux';
  else if (userAgent.includes('Android')) operatingSystem = 'android';
  else if (userAgent.includes('iOS')) operatingSystem = 'ios';

  // URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const utmMedium = urlParams.get('utm_medium');
  const utmCampaign = urlParams.get('utm_campaign');
  const utmTerm = urlParams.get('utm_term');
  const utmContent = urlParams.get('utm_content');

  // Time/date context
  const now = new Date();
  const timeOfDay = now.getHours();
  const dayOfWeek = now.getDay();
  const dayOfMonth = now.getDate();
  const month = now.getMonth() + 1;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isBusinessHours = timeOfDay >= 9 && timeOfDay <= 17 && !isWeekend;

  // Season calculation
  const getSeason = (month: number) => {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  };

  // Referrer analysis
  const referrer = document.referrer || undefined;
  let referrerDomain: string | undefined = undefined;

  if (referrer) {
    try {
      const referrerUrl = new URL(referrer);
      referrerDomain = referrerUrl.hostname;
    } catch (e) {
      // Invalid URL, keep undefined
    }
  }

  const isDirectTraffic = !referrer || referrer === window.location.origin;

  return {
    // Device & Technology
    device_type: deviceType,
    operating_system: operatingSystem,
    browser,
    browser_version: browserVersion,
    screen_resolution: `${screen.width}x${screen.height}`,
    screen_width: screen.width,
    screen_height: screen.height,
    user_agent: userAgent,
    is_mobile: isMobile,
    is_tablet: isTablet,
    is_desktop: isDesktop,

    // Location & Geography
    language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Behavior & Engagement
    referrer,
    referrer_domain: referrerDomain,

    // Traffic Source
    utm_source: utmSource ?? undefined,
    utm_medium: utmMedium ?? undefined,
    utm_campaign: utmCampaign ?? undefined,
    utm_term: utmTerm ?? undefined,
    utm_content: utmContent ?? undefined,
    is_direct_traffic: isDirectTraffic,

    // Time & Date
    time_of_day: timeOfDay,
    day_of_week: dayOfWeek,
    day_of_month: dayOfMonth,
    month,
    season: getSeason(month),
    is_weekend: isWeekend,
    is_business_hours: isBusinessHours,

    // Additional context that could be populated by your app
    visit_count: parseInt(localStorage.getItem('visit_count') || '1'),
    page_views: parseInt(sessionStorage.getItem('page_views') || '1'),
  };
}
