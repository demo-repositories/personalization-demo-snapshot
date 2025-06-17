# Segmentation System

A powerful segmentation system for Sanity Studio that enables content personalization based on user attributes and behavior. This system allows content editors to create reusable audience segments and deliver personalized experiences based on device information, location data, user behavior, demographics, and custom attributes.

## Features

- 🎯 **Reusable Audience Segments**: Create segments once, use across all content
- 🔧 **Flexible Targeting Rules**: 21+ operators including regex, date ranges, and count-based conditions
- 📱 **Device Detection**: Target by device type, browser, operating system, and screen size
- 🌍 **Location Targeting**: Country, region, timezone, and language-based personalization
- ⏰ **Time-based Rules**: Target based on time of day, day of week, season
- 📊 **Behavioral Targeting**: Page views, session data, referrer information, and user interactions
- 🎨 **Content Variants**: Different content for each audience segment with fallback support
- 🔍 **Preview Mode**: Test segments directly in Sanity Studio
- 📋 **Centralized Management**: Manage all segments in one place with priority, status, and organization

## Architecture

The system uses a reference-based architecture where:
1. **Audience Segments** are standalone documents that define targeting rules
2. **Segmentation Fields** reference these segments and define personalized content variants
3. **Frontend Utilities** evaluate segments and deliver personalized content

## Installation

The segmentation system has been added to your Sanity Studio. The following files were created/modified:

### Sanity Studio Files
- `apps/studio/schemaTypes/documents/segment.ts` - Audience segment document type
- `apps/studio/schemaTypes/definitions/segmentation.ts` - Segmentation field definition
- `apps/studio/schemaTypes/documents/index.ts` - Updated to include segments
- `apps/studio/structure.ts` - Added segments to navigation

### Frontend Files
- `apps/web/src/lib/segmentation.ts` - Segmentation utilities
- `apps/web/src/hooks/use-segmentation.ts` - React hooks
- `apps/web/src/components/personalized-blog-card.tsx` - Example component

## Usage in Sanity Studio

### 1. Creating Audience Segments

First, create reusable audience segments:

1. **Navigate to "Audience Segments"** in the Sanity Studio sidebar
2. **Create New Segment**: Click "Create" to add a new audience segment
3. **Configure Basic Info**: 
   - Name (e.g., "Mobile Users", "First-time Visitors")
   - Description and internal notes
   - Priority (1-100, higher = more important)
   - Status (Active, Draft, or Archived)
4. **Set Up Targeting Rules**: Define who belongs to this segment
   - Choose rule logic (AND/OR)
   - Add targeting conditions by category
   - Test different operators and values
5. **Add Metadata**: Tags, estimated audience size, and notes for organization

### 2. Adding Personalization to Content

Add the segmentation field to any document type:

```typescript
import { defineField, defineType } from "sanity";

export const myDocument = defineType({
  name: "myDocument",
  title: "My Document",
  type: "document",
  fields: [
    // ... other fields
    defineField({
      name: "personalization",
      type: "segmentation",
      title: "Content Personalization",
      description: "Configure different versions for different audiences",
    }),
  ],
});
```

### 3. Creating Content Variants

1. **Enable Personalization**: Toggle the switch to activate personalization
2. **Add Segment Variants**: Click "Add item" to create personalized versions
3. **Select Segments**: Choose from your created audience segments (only active segments are shown)
4. **Define Content**: Specify personalized content for each segment
5. **Configure Fallback**: Set default content for unmatched users

### 4. Managing Segments

The centralized segment management provides several benefits:

- **Reusability**: Create segments once, use across all content types
- **Consistency**: Ensure consistent targeting across your site
- **Organization**: Use tags and status to organize segments
- **Performance**: See estimated audience size for each segment
- **Lifecycle**: Draft, test, activate, and archive segments as needed

**Segment Status:**
- **Active**: Currently being used for personalization
- **Draft**: Being developed or tested
- **Archived**: No longer in use but kept for reference

### 5. Targeting Categories

#### Device & Technology
- `device_type`: mobile, desktop, tablet
- `operating_system`: iOS, Android, Windows, macOS, Linux  
- `browser`: Chrome, Safari, Firefox, Edge
- `browser_version`: Browser version number
- `screen_resolution`: Screen dimensions
- `screen_width`: Screen width in pixels
- `screen_height`: Screen height in pixels
- `user_agent`: Full user agent string
- `is_mobile`: Boolean mobile detection
- `is_tablet`: Boolean tablet detection  
- `is_desktop`: Boolean desktop detection

#### Location & Geography
- `country`: Country name
- `country_code`: Country code (US, UK, DE, etc.)
- `region`: State/province
- `city`: City name
- `timezone`: User timezone
- `language`: Primary browser language
- `ip_address`: IP address

#### Behavior & Engagement
- `page_views`: Total page views
- `session_duration`: Current session duration
- `pages_per_session`: Pages per session
- `bounce_rate`: Bounce rate percentage
- `previous_page`: Last page visited
- `referrer`: Referring website
- `referrer_domain`: Referring domain
- `time_on_page`: Time on current page
- `scroll_depth`: Current scroll percentage
- `clicks`: Number of clicks
- `form_submissions`: Form interactions

#### Demographics
- `age`: User age
- `gender`: User gender
- `income`: Annual income
- `education`: Education level
- `job_title`: Job title
- `company_size`: Company size category
- `industry`: Industry category

#### Traffic Source
- `utm_source`: Campaign source
- `utm_medium`: Campaign medium
- `utm_campaign`: Campaign name
- `utm_term`: Campaign term
- `utm_content`: Campaign content
- `referrer_domain`: Referring domain
- `is_direct_traffic`: Direct visitor flag
- `is_returning_visitor`: Return visitor flag
- `visit_count`: Number of visits

#### Time & Date
- `time_of_day`: Hour (0-23)
- `day_of_week`: Day (0-6, Sunday = 0)
- `day_of_month`: Day of month (1-31)
- `month`: Month (1-12)
- `season`: spring, summer, fall, winter
- `is_weekend`: Weekend visitor flag
- `is_business_hours`: Business hours flag

#### Custom Attributes
- `user_id`: User identifier
- `subscription_status`: Subscription status
- `loyalty_tier`: Customer loyalty tier
- `login_status`: Login status flag
- `feature_flags`: Feature flags mapping
- `custom_events`: Array of custom events

### 6. Condition Operators

#### Basic Operators
- **equals**: Exact match
- **does not equal**: Not equal
- **contains**: String contains value
- **does not contain**: String doesn't contain
- **starts with**: String starts with value
- **ends with**: String ends with value
- **is empty**: Field is empty/null
- **is not empty**: Field has value
- **is in list**: Value in comma-separated list
- **is not in list**: Value not in list

#### Advanced Operators
- **matches regex**: Regular expression pattern matching
- **greater than**: Numeric greater than
- **less than**: Numeric less than
- **greater than or equal**: Numeric ≥
- **less than or equal**: Numeric ≤
- **between (inclusive)**: Value falls within range
- **not between**: Value outside of range

#### Time-based Operators
- **happened in last X days**: Event occurred within timeframe
- **happened more than X days ago**: Event occurred before timeframe

#### Count-based Operators
- **happened exactly X times**: Event count matches exactly
- **happened more than X times**: Event count exceeds threshold
- **happened less than X times**: Event count below threshold

## Frontend Integration

### Setting Up React Hooks

```tsx
import { useSegmentation } from "@/hooks/use-segmentation";
import { UserContext } from "@/lib/segmentation";

export function PersonalizedComponent({ segmentationData }: { segmentationData: any }) {
  const { personalizedContent, isLoading, matchedSegment } = useSegmentation(
    segmentationData,
    userContext
  );

  if (isLoading) {
    return <div>Loading personalized content...</div>;
  }

  return (
    <div>
      <h2>{personalizedContent.title}</h2>
      <p>{personalizedContent.description}</p>
      {matchedSegment && (
        <div className="debug">
          Matched segment: {matchedSegment.name}
        </div>
      )}
    </div>
  );
}
```

### Creating User Context

```tsx
import { createUserContextFromBrowser } from "@/lib/segmentation";

// Client-side context creation
const userContext = createUserContextFromBrowser();

// Server-side context creation
const userContext = createUserContextFromRequest(request);
```

### Querying Segmented Content

```typescript
// GROQ query for blog posts with segmentation
const query = `*[_type == "blog" && slug.current == $slug][0]{
  title,
  slug,
  content,
  personalization{
    enabled,
    fallbackContent,
    segmentVariants[]{
      segment->{
        _id,
        name,
        slug,
        status,
        priority,
        conditions
      },
      content
    }
  }
}`;
```

## Examples

### Example 1: Mobile vs Desktop Headlines

Create segments:
1. **Mobile Users**: `device_type` equals `mobile`
2. **Desktop Users**: `device_type` equals `desktop`

Configure variants:
- **Mobile**: "Quick Tips for Your Phone"
- **Desktop**: "Complete Guide: Advanced Strategies"
- **Fallback**: "Essential Tips and Strategies"

### Example 2: New vs Returning Visitors

Create segments:
1. **First-time Visitors**: `visit_count` equals `1`
2. **Returning Users**: `visit_count` greater than `1`

Configure variants:
- **New visitors**: "Welcome! Start with our beginner's guide"
- **Returning users**: "Welcome back! Check out what's new"
- **Fallback**: "Discover what's possible"

### Example 3: Geographic Personalization

Create segments:
1. **European Visitors**: `continent` equals `Europe`
2. **US Visitors**: `country` equals `United States`

Configure variants:
- **Europe**: "GDPR-compliant solution trusted across Europe"
- **US**: "Trusted by companies across America"
- **Fallback**: "Trusted by companies worldwide"

### Example 4: Time-based Content

Create segments:
1. **Business Hours**: `is_business_hours` equals `true`
2. **After Hours**: `is_business_hours` equals `false`

Configure variants:
- **Business hours**: "Talk to sales now - we're available!"
- **After hours**: "Leave your info - we'll call you tomorrow"
- **Fallback**: "Get in touch with our team"

## Performance & Best Practices

### Performance Optimization

1. **Limit Active Segments**: Keep only necessary segments active
2. **Simple Conditions**: Avoid overly complex rule combinations
3. **Efficient Queries**: Use proper GROQ projections
4. **Caching**: Implement user context caching when appropriate
5. **Fallback Content**: Always provide fallback content

### Content Strategy

1. **Start Simple**: Begin with device/location targeting
2. **A/B Test**: Test personalized vs. generic content
3. **Monitor Performance**: Track engagement metrics
4. **User Privacy**: Respect user privacy preferences
5. **Progressive Enhancement**: Ensure content works without JavaScript

### Studio Workflow

1. **Draft First**: Create segments in draft status
2. **Test Segments**: Use preview mode to test targeting
3. **Gradual Rollout**: Activate segments gradually
4. **Monitor Usage**: Track which segments are being used
5. **Clean Up**: Archive unused segments regularly

## Troubleshooting

### Common Issues

**Segment not matching users:**
- Check segment status is "Active"
- Verify targeting conditions are correct
- Test with browser developer tools
- Check user context values

**Content not personalizing:**
- Verify segmentation is enabled
- Check fallback content is defined
- Ensure frontend integration is correct
- Test user context creation

**Performance issues:**
- Reduce number of active segments
- Simplify complex conditions
- Implement proper caching
- Optimize GROQ queries

### Debugging Tips

1. **Console Logging**: Log user context and evaluation results
2. **Preview Mode**: Use Sanity Studio preview mode
3. **Network Tab**: Check API calls and responses
4. **Segment Priority**: Higher priority segments match first
5. **Rule Logic**: AND requires all conditions, OR requires any condition

## Conclusion

This segmentation system provides a powerful foundation for content personalization in Sanity Studio. By creating reusable audience segments and configuring personalized content variants, you can deliver targeted experiences that improve user engagement and conversion rates.

The reference-based architecture ensures your segments remain organized and reusable across your entire content ecosystem, while the flexible targeting rules allow for sophisticated audience definition based on user behavior, demographics, and technical attributes. 