# Component-Level Personalization Guide

A flexible personalization system that allows you to add personalized content variants to any component in your Sanity Studio. This system enables content editors to create different versions of components for specific audience segments with holdout testing capabilities.

## Features

- 🎯 **Component-Agnostic**: Add personalization to any component (Hero, CTA, Feature Cards, etc.)
- 📊 **Holdout Testing**: Built-in A/B testing with configurable holdout percentages
- 🔄 **Reference-Based**: Uses existing audience segments for consistency
- 🎨 **Flexible Content**: Each variant can have completely different content
- 🔍 **Preview Mode**: Test variants directly in Sanity Studio
- ⚡ **Performance**: Client-side evaluation with consistent user assignment

## Architecture

### Core Components

1. **Personalization Helper**: `createPersonalizationFields()` - Generates personalization fields for any component
2. **Frontend Utilities**: `component-personalization.ts` - Handles evaluation and content selection
3. **React Hooks**: `useComponentPersonalization()` - Easy integration in React components
4. **Segment References**: Uses existing audience segments from the segmentation system

### How It Works

1. **Studio**: Content editors enable personalization and create variants for different segments
2. **Frontend**: System evaluates user context against segment conditions
3. **Selection**: Highest priority matching segment is selected (with holdout logic)
4. **Rendering**: Component displays personalized or default content

## Setup Guide

### 1. Add Personalization to a Component

Use the helper function to add personalization fields to any component schema:

```typescript
// For a generic component
import { createPersonalizationFields } from "../definitions/personalization";

const componentFields = [
  defineField({ name: "title", type: "string" }),
  defineField({ name: "description", type: "text" }),
  // ... other component fields
];

export const myComponent = defineType({
  name: "myComponent",
  fields: [
    ...componentFields,
    createPersonalizationFields(componentFields, "my component"),
  ],
});
```

```typescript
// For Hero component (pre-built helper)
import { createHeroPersonalizationFields } from "../definitions";

export const hero = defineType({
  name: "hero",
  fields: [
    // ... existing hero fields
    createHeroPersonalizationFields(),
  ],
});
```

### 2. Create Frontend Component

Build your component to handle personalized content:

```tsx
import { useComponentPersonalization } from "@/lib/component-personalization";

interface MyComponentProps {
  title?: string;
  description?: string;
  personalization?: ComponentPersonalization<{
    title?: string;
    description?: string;
  }>;
}

export function MyComponent({ title, description, personalization }: MyComponentProps) {
  // Create fallback content from props
  const fallbackContent = { title, description };
  
  const { content, isPersonalized, matchedSegment } = useComponentPersonalization(
    personalization || null,
    fallbackContent
  );

  const finalContent = content || fallbackContent;

  return (
    <div>
      {isPersonalized && (
        <div className="debug">Personalized for: {matchedSegment?.name}</div>
      )}
      <h2>{finalContent.title}</h2>
      <p>{finalContent.description}</p>
    </div>
  );
}
```

### 3. Query Personalized Content

Use GROQ to fetch components with personalization data:

```typescript
const query = `*[_type == "page"][0]{
  pageBuilder[]{
    _type,
    // Standard component fields (used as fallback)
    title,
    description,
    image,
    buttons,
    
    // Personalization data
    personalization{
      enabled,
      variants[]{
        segment->{
          _id,
          name,
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
```

## Usage in Sanity Studio

### 1. Enable Personalization

1. **Open your component** in the page builder
2. **Configure the regular component content** - this serves as your default/fallback content
3. **Navigate to the "Personalization" tab** in the studio interface
4. **Toggle "Enable Personalization"** to activate personalized variants

### 2. Create Variants

1. **Click "Add item"** in the Personalized Variants section
2. **Select a target segment** from your existing audience segments
3. **Set holdout percentage** (0-100%) for A/B testing
4. **Configure personalized content** for this segment

### 3. Holdout Testing

The holdout percentage determines what portion of matching users see the default content instead of the personalized variant:

- **0%**: All matching users see personalized content
- **50%**: Half see personalized, half see default (perfect A/B test)
- **100%**: All matching users see default content (effectively disabled)

Users are consistently assigned to holdout/treatment groups based on their user ID and segment.

## Component Examples

### Hero Component

```typescript
// Schema definition
export const hero = defineType({
  name: "hero",
  fields: [
    defineField({ name: "badge", type: "string" }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "richText", type: "richText" }),
    defineField({ name: "image", type: "image" }),
    defineField({ name: "buttons", type: "array", of: [{ type: "button" }] }),
    createHeroPersonalizationFields(),
  ],
});
```

```tsx
// React component
export function PersonalizedHero({ personalization, ...props }: HeroProps) {
  const fallbackContent = {
    badge: props.badge,
    title: props.title,
    richText: props.richText,
    image: props.image,
    buttons: props.buttons,
  };
  
  const { content } = useHeroPersonalization(personalization || null, fallbackContent);
  const finalContent = content || fallbackContent;

  return (
    <section>
      {finalContent.badge && <span>{finalContent.badge}</span>}
      <h1>{finalContent.title}</h1>
      {/* ... render other fields */}
    </section>
  );
}
```

### CTA Component

```typescript
// Create CTA-specific personalization
function createCTAPersonalizationFields() {
  const ctaFields = [
    defineField({ name: "headline", type: "string" }),
    defineField({ name: "description", type: "text" }),
    defineField({ name: "buttonText", type: "string" }),
    defineField({ name: "buttonUrl", type: "url" }),
    defineField({ name: "style", type: "string", options: { 
      list: ["primary", "secondary", "outline"] 
    }}),
  ];

  return createPersonalizationFields(ctaFields, "CTA");
}
```

### Feature Cards Component

```typescript
// Create feature cards personalization
function createFeatureCardsPersonalizationFields() {
  const featureCardsFields = [
    defineField({ 
      name: "cards", 
      type: "array", 
      of: [{ 
        type: "object",
        fields: [
          defineField({ name: "icon", type: "string" }),
          defineField({ name: "title", type: "string" }),
          defineField({ name: "description", type: "text" }),
        ]
      }] 
    }),
  ];

  return createPersonalizationFields(featureCardsFields, "feature cards");
}
```

## Advanced Use Cases

### 1. Geographic Personalization

**Segments:**
- **US Visitors**: `country` equals `United States`  
- **EU Visitors**: `country` in list `Germany,France,Spain,Italy,Netherlands`

**Variants:**
- **US**: "Start your free trial today!"
- **EU**: "Begin your GDPR-compliant trial!"

### 2. Device-Specific Content

**Segments:**
- **Mobile Users**: `device_type` equals `mobile`
- **Desktop Users**: `device_type` equals `desktop`

**Variants:**
- **Mobile**: Shorter headlines, simplified CTAs
- **Desktop**: Detailed descriptions, multiple CTAs

### 3. Returning vs New Visitors

**Segments:**
- **New Visitors**: `visit_count` equals `1`
- **Returning Users**: `visit_count` greater than `1`

**Variants:**
- **New**: "Welcome! Discover what we offer"
- **Returning**: "Welcome back! See what's new"

### 4. Time-Based Personalization

**Segments:**
- **Business Hours**: `is_business_hours` equals `true`
- **After Hours**: `is_business_hours` equals `false`

**Variants:**
- **Business**: "Chat with us now!" + Live chat CTA
- **After hours**: "Leave a message" + Contact form CTA

## Best Practices

### Content Strategy

1. **Start Simple**: Begin with device/location personalization
2. **Clear Differences**: Make variants meaningfully different
3. **Consistent Messaging**: Maintain brand voice across variants
4. **Test Systematically**: Use holdout percentages to measure impact

### Performance

1. **Limit Variants**: 2-4 variants per component is optimal
2. **Active Segments Only**: System filters to active segments automatically
3. **Consistent Assignment**: Users see the same variant on repeat visits
4. **Smart Fallback**: Regular component content serves as fallback (no duplication)

### Studio Workflow

1. **Create Segments First**: Set up audience segments before adding variants
2. **Use Meaningful Names**: Name segments clearly (e.g., "Mobile Users", "EU Visitors")
3. **Set Priorities**: Higher priority segments match first
4. **Test Regularly**: Use preview mode to verify targeting

### A/B Testing

1. **50/50 Split**: Use 50% holdout for balanced A/B tests
2. **Statistical Significance**: Run tests long enough for meaningful data
3. **Single Variable**: Test one change at a time
4. **Measure Impact**: Track engagement metrics for each variant

## Debugging

### Development Mode

Enable debug information in development:

```tsx
{process.env.NODE_ENV === "development" && isPersonalized && (
  <div className="debug-info">
    📊 Personalized for: {matchedSegment?.name}
    🎯 Holdout: {matchedVariant?.holdoutPercentage}%
  </div>
)}
```

### Debug Utility

Use the debug utility to understand targeting:

```typescript
import { debugComponentPersonalization } from "@/lib/component-personalization";

const debug = debugComponentPersonalization(personalization, userContext);
console.log("Personalization debug:", debug);

// Output:
// {
//   enabled: true,
//   variants: [...],
//   matchingVariants: [...],
//   selectedVariant: {...},
//   selectedContent: "personalized"
// }
```

### Common Issues

**Variant not showing:**
- Check segment status is "Active"
- Verify targeting conditions match user context
- Confirm personalization is enabled
- Check holdout percentage isn't 100%

**Wrong variant showing:**
- Review segment priorities (higher = more important)
- Check for overlapping targeting conditions
- Verify user context data accuracy

**Performance issues:**
- Reduce number of active variants
- Simplify targeting conditions
- Use browser developer tools to check evaluation

## Migration from Document-Level Personalization

If you're migrating from the previous document-level system:

1. **Create component variants** instead of document variants
2. **Use segment references** instead of embedded conditions
3. **Add holdout percentages** for A/B testing capabilities
4. **Update frontend components** to use new hooks

## Extending the System

### Adding New Component Types

1. **Define component fields** specific to your component
2. **Create personalization helper** using `createPersonalizationFields()`
3. **Build React component** with personalization hook
4. **Add to your schema** and test in Studio

### Custom Evaluation Logic

Extend the evaluation system for custom requirements:

```typescript
export function getCustomPersonalizedContent<T>(
  personalization: ComponentPersonalization<T>,
  context: UserContext,
  customLogic?: (variant: PersonalizedVariant<T>) => boolean
): T {
  // Your custom evaluation logic here
  const matchingVariants = personalization.variants.filter(variant => {
    const basicMatch = evaluateConditions(variant.segment.conditions, context);
    const customMatch = customLogic ? customLogic(variant) : true;
    return basicMatch && customMatch;
  });
  
  // ... rest of selection logic
}
```

## Segment Preview Mode

The system includes a powerful preview feature that allows content editors to test personalized content by switching between different audience segments directly in the browser.

### How It Works

**Automatic Detection:**
- Preview mode activates automatically when in Sanity's presentation mode or draft mode
- Detects preview URLs with `?preview` or `?sanity-preview` parameters
- Works seamlessly with Sanity's "Open in Presentation" feature

**Preview Interface:**
- **Preview Bar**: Fixed bar at top of page showing current preview state
- **Page-Specific Segments**: Dropdown shows only segments configured for personalization on the current page
- **Default Option**: Choose "No Segment" to see default content without personalization
- **Smart Display**: Shows "No personalized segments configured" when no variants exist on the page
- **Persistent Selection**: Preview choice persists across page navigation during session

**Visual Indicators:**
- Personalized components show preview badges indicating which segment is active
- Clear distinction between actual personalization and preview mode
- Debug information available in development mode

### Using Preview Mode

**For Content Editors:**

1. **Open Sanity Studio** and navigate to your content
2. **Click "Open in Presentation"** to view the live site in preview mode
3. **Use the preview bar** at the top to select different segments
4. **Navigate through pages** to see how personalization affects different components
5. **Test all variants** by switching between segments and default content

**For Developers:**

```tsx
import { useSegmentPreview } from "@/hooks/use-segment-preview";

function MyComponent({ personalization, ...props }) {
  const { isPreviewMode, previewSegmentId } = useSegmentPreview();
  
  // Component automatically uses preview segment when available
  const { content, isPersonalized, matchedSegment } = useComponentPersonalization(
    personalization,
    fallbackContent
  );

  return (
    <div>
      {/* Preview indicator for editors */}
      {isPreviewMode && (
        <div className="preview-badge">
          🎯 Preview: {previewSegmentId ? matchedSegment?.name : 'Default'}
        </div>
      )}
      
      {/* Your component content */}
      <h1>{content?.title}</h1>
    </div>
  );
}
```

### Technical Implementation

**Components Added:**
- `SegmentPreviewProvider`: Context provider managing preview state
- `SegmentPreviewBar`: Preview interface with segment selector
- `SegmentPreviewToggle`: Dropdown component for segment selection
- `useSegmentPreview()`: React hook for accessing preview state

**Integration Points:**
- Automatically integrates with existing personalization hooks
- Uses session storage to persist selections across navigation
- Dynamically fetches only segments used in personalization variants on the current page
- Updates segment list when navigating between pages

**Preview Override:**
```typescript
// Manual preview testing in development
<PersonalizedHero 
  personalization={heroPersonalization}
  previewSegment="mobile-users" // Force specific segment
  {...heroProps}
/>
```

### Benefits

**For Content Teams:**
- ✅ **Instant feedback** - See changes immediately without complex setup
- ✅ **Complete testing** - Test all segments and variants in one session
- ✅ **Visual confirmation** - Clear indicators show which variant is active
- ✅ **No setup required** - Works automatically with existing workflow

**For Development Teams:**
- ✅ **Simplified QA** - Easy testing of all personalization scenarios
- ✅ **Debug assistance** - Visual feedback helps troubleshoot targeting
- ✅ **Integration testing** - Test segment interactions across pages
- ✅ **Client presentation** - Demo personalization features to stakeholders

This component-level personalization system provides maximum flexibility while maintaining ease of use for content editors and developers alike. 