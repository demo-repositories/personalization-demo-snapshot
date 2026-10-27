/**
 * Component-level personalization utilities
 * This module provides functions to handle personalized content for individual components
 */

import {
  UserContext,
  Segment,
  evaluateConditions,
  createUserContextFromBrowser,
} from './segmentation';

export interface PersonalizedVariant<T = any> {
  segment: Segment;
  holdoutPercentage: number;
  content: T;
}

export interface ComponentPersonalization<T = any> {
  enabled: boolean;
  variants: PersonalizedVariant<T>[];
}

export interface HeroContent {
  badge?: string;
  title?: string;
  richText?: any;
  image?: any;
  buttons?: any[];
}

export interface CTAContent {
  eyebrow?: string;
  title?: string;
  richText?: any;
  buttons?: any[];
}

/**
 * Evaluates personalization for a component and returns the appropriate content
 */
export function getPersonalizedComponentContent<T>(
  personalization: ComponentPersonalization<T> | null,
  context: UserContext,
  fallbackContent?: T,
  previewSegment?: string,
): T | null {
  if (!personalization || !personalization.enabled) {
    return fallbackContent || null;
  }

  // Handle preview mode
  if (previewSegment) {
    const variant = personalization.variants.find(
      (v) => v.segment._id === previewSegment || v.segment.name === previewSegment,
    );
    if (variant) {
      return variant.content;
    }
  }

  // Find matching variants
  const matchingVariants = personalization.variants
    .filter((variant) => {
      // Only consider active segments
      if (variant.segment.status !== 'active') return false;

      // Check if segment conditions match
      return evaluateConditions(variant.segment.conditions, context);
    })
    .sort((a, b) => b.segment.priority - a.segment.priority); // Sort by priority

  // Use the highest priority matching variant
  const selectedVariant = matchingVariants[0];

  if (selectedVariant) {
    // Apply holdout logic
    const holdoutPercentage = selectedVariant.holdoutPercentage || 0;
    if (holdoutPercentage > 0) {
      const userId = context.user_id || 'anonymous';
      const hash = simpleHash(userId + selectedVariant.segment._id);
      const random = Math.abs(hash) % 100;

      if (random < holdoutPercentage) {
        // User is in holdout group, show default content
        return fallbackContent || null;
      }
    }

    return selectedVariant.content;
  }

  // No matching variants, return default content
  return fallbackContent || null;
}

/**
 * Simple hash function for consistent holdout assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * React hook for component-level personalization
 */
export function useComponentPersonalization<T>(
  personalization: ComponentPersonalization<T> | null,
  fallbackContent?: T,
  previewSegmentFromContext?: string | null,
) {
  const context = createUserContextFromBrowser();

  // Use preview segment from context (reactive to changes)
  const previewSegment = previewSegmentFromContext || undefined;

  const personalizedContent = getPersonalizedComponentContent(
    personalization,
    context,
    fallbackContent,
    previewSegment,
  );

  const matchingVariant = personalization?.variants.find((variant) => {
    if (previewSegment) {
      return variant.segment._id === previewSegment || variant.segment.name === previewSegment;
    }

    if (variant.segment.status !== 'active') return false;
    return evaluateConditions(variant.segment.conditions, context);
  });

  return {
    content: personalizedContent,
    isPersonalized: Boolean(personalization?.enabled && matchingVariant),
    matchedSegment: matchingVariant?.segment || null,
    isLoading: false, // Since we're using browser context, no async loading
  };
}

/**
 * Hero-specific personalization hook
 */
export function useHeroPersonalization(
  personalization: ComponentPersonalization<HeroContent> | null,
  fallbackContent?: HeroContent,
  previewSegmentFromContext?: string | null,
) {
  return useComponentPersonalization<HeroContent>(
    personalization,
    fallbackContent,
    previewSegmentFromContext,
  );
}

/**
 * CTA-specific personalization hook
 */
export function useCTAPersonalization(
  personalization: ComponentPersonalization<CTAContent> | null,
  fallbackContent?: CTAContent,
  previewSegmentFromContext?: string | null,
) {
  return useComponentPersonalization<CTAContent>(
    personalization,
    fallbackContent,
    previewSegmentFromContext,
  );
}

/**
 * Debug utility for component personalization
 */
export function debugComponentPersonalization<T>(
  personalization: ComponentPersonalization<T> | null,
  context: UserContext,
) {
  if (!personalization) {
    return {
      enabled: false,
      message: 'No personalization data provided',
    };
  }

  if (!personalization.enabled) {
    return {
      enabled: false,
      message: 'Personalization is disabled',
    };
  }

  const variantResults = personalization.variants.map((variant) => {
    const matches = evaluateConditions(variant.segment.conditions, context);
    return {
      segment: variant.segment.name,
      priority: variant.segment.priority,
      status: variant.segment.status,
      matches,
      holdout: variant.holdoutPercentage,
    };
  });

  const matchingVariants = variantResults.filter((v) => v.matches && v.status === 'active');
  const selectedVariant = matchingVariants.sort((a, b) => b.priority - a.priority)[0];

  return {
    enabled: true,
    variants: variantResults,
    matchingVariants,
    selectedVariant,
    hasFallback: true, // Always has fallback (component content)
    selectedContent: selectedVariant ? 'personalized' : 'default',
  };
}
