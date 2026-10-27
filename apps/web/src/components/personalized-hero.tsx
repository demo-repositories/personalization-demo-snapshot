/**
 * Personalized Hero Component
 * Demonstrates how to use component-level personalization
 */

import React from 'react';
import {
  useHeroPersonalization,
  ComponentPersonalization,
  HeroContent,
} from '@/lib/component-personalization';
import { useSegmentPreview } from '@/hooks/use-segment-preview';

interface PersonalizedHeroProps {
  // Standard hero content (used when personalization is disabled)
  badge?: string;
  title?: string;
  richText?: any;
  image?: any;
  buttons?: any[];

  // Personalization data
  personalization?: ComponentPersonalization<HeroContent>;

  // Preview mode for Sanity Studio
  previewSegment?: string;
}

export function PersonalizedHero({
  badge,
  title,
  richText,
  image,
  buttons,
  personalization,
  previewSegment,
}: PersonalizedHeroProps) {
  // Create fallback content from component props
  const fallbackContent = {
    badge,
    title,
    richText,
    image,
    buttons,
  };

  const { isPreviewMode, previewSegmentId } = useSegmentPreview();

  const { content, isPersonalized, matchedSegment } = useHeroPersonalization(
    personalization || null,
    fallbackContent,
    previewSegment,
  );

  // Use personalized content if available, otherwise use fallback
  const finalContent = content || fallbackContent;

  return (
    <section className="hero-section">
      {/* Preview mode indicator */}
      {isPreviewMode && (
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 p-3 text-sm mb-4 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-purple-600 font-medium">🎯 Preview Mode:</span>
            {previewSegmentId ? (
              <span className="text-purple-800">
                Showing content for "{matchedSegment?.name || 'Unknown Segment'}"
              </span>
            ) : (
              <span className="text-purple-800">
                Showing default content (no segment targeting)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && isPersonalized && (
        <div className="bg-blue-100 p-2 text-xs">📊 Personalized for: {matchedSegment?.name}</div>
      )}

      {finalContent.badge && <div className="hero-badge">{finalContent.badge}</div>}

      {finalContent.title && <h1 className="hero-title">{finalContent.title}</h1>}

      {finalContent.richText && (
        <div className="hero-content">
          {/* Render your rich text here */}
          {/* This would typically use a RichText component */}
          <div dangerouslySetInnerHTML={{ __html: finalContent.richText }} />
        </div>
      )}

      {finalContent.image && (
        <div className="hero-image">
          {/* Render your image here */}
          {/* This would typically use a SanityImage component */}
          <img
            src={finalContent.image.asset?.url}
            alt={finalContent.image.alt || finalContent.title}
          />
        </div>
      )}

      {finalContent.buttons && finalContent.buttons.length > 0 && (
        <div className="hero-buttons">
          {finalContent.buttons.map((button, index) => (
            <a
              key={index}
              href={button.url}
              className="hero-button"
              target={button.external ? '_blank' : undefined}
              rel={button.external ? 'noopener noreferrer' : undefined}
            >
              {button.text}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

// Example usage in a page component:
/*
// GROQ query to fetch hero with personalization
const heroQuery = `*[_type == "page" && slug.current == $slug][0]{
  "hero": pageBuilder[_type == "hero"][0]{
    badge,
    title,
    richText,
    image,
    buttons,
    personalization{
      enabled,
      variants[]{
        segment->{
          _id,
          name,
          slug,
          status,
          priority,
          conditions
        },
        holdoutPercentage,
        content
      }
    }
  }
}`;

// In your page component:
export default function HomePage({ hero }) {
  return (
    <PersonalizedHero
      // Standard props (fallback when personalization is disabled)
      badge={hero.badge}
      title={hero.title}
      richText={hero.richText}
      image={hero.image}
      buttons={hero.buttons}
      
      // Personalization data
      personalization={hero.personalization}
    />
  );
}
*/
