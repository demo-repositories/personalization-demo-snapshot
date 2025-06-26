import React, { useEffect, useState } from "react";
import { useClient } from "sanity";

import { AnalyticsPane } from "../components/analytics-pane";

interface DocumentSegmentUsage {
  segmentId: string;
  segmentName: string;
  componentType: string;
  componentCount: number;
}

interface PersonalizationConfig {
  usedSegments: DocumentSegmentUsage[];
  totalPersonalizedComponents: number;
}

interface DocumentViewProps {
  document: {
    draft?: any;
    published?: any;
    displayed?: any;
    historical?: any;
  };
  documentId: string;
  schemaType: string;
}

export const AnalyticsView: React.FC<DocumentViewProps> = ({
  document,
  documentId,
  schemaType,
}) => {
  const [personalizationConfig, setPersonalizationConfig] =
    useState<PersonalizationConfig | null>(null);
  const client = useClient({ apiVersion: "2025-02-10" });

  // Use the displayed version of the document, falling back to draft
  const currentDocument = document.displayed || document.draft || {};

  // Transform to match the expected format for AnalyticsPane
  const analyticsDocument = {
    _id: documentId || "unknown",
    _type: schemaType || "unknown",
    title:
      typeof currentDocument.title === "string"
        ? currentDocument.title
        : undefined,
    slug:
      currentDocument.slug && typeof currentDocument.slug === "object"
        ? currentDocument.slug
        : undefined,
  };

  // Extract personalization configuration from document
  useEffect(() => {
    const getDocumentPersonalization =
      async (): Promise<PersonalizationConfig> => {
        try {
          if (!currentDocument?.pageBuilder) {
            return { usedSegments: [], totalPersonalizedComponents: 0 };
          }

          const usedSegmentsMap = new Map<string, DocumentSegmentUsage>();
          let totalPersonalizedComponents = 0;

          // Process pageBuilder components to find personalization
          const pageBuilder = Array.isArray(currentDocument.pageBuilder)
            ? currentDocument.pageBuilder
            : [];

          for (const component of pageBuilder) {
            // Check if personalization is enabled and has variants
            if (
              component.personalization?.enabled &&
              component.personalization?.variants?.length > 0
            ) {
              totalPersonalizedComponents++;

              // Fetch segment details for each variant
              for (const variant of component.personalization.variants) {
                const segmentId = variant.segment?._ref;

                if (segmentId) {
                  try {
                    const segment = await client.fetch(
                      `*[_id == $segmentId][0]{ _id, name }`,
                      { segmentId },
                    );

                    if (segment) {
                      if (usedSegmentsMap.has(segmentId)) {
                        usedSegmentsMap.get(segmentId)!.componentCount++;
                      } else {
                        usedSegmentsMap.set(segmentId, {
                          segmentId,
                          segmentName: segment.name || "Unnamed Segment",
                          componentType: component._type,
                          componentCount: 1,
                        });
                      }
                    }
                  } catch (error) {
                    console.error("Error fetching segment:", segmentId, error);
                  }
                }
              }
            }
          }

          return {
            usedSegments: Array.from(usedSegmentsMap.values()),
            totalPersonalizedComponents,
          };
        } catch (error) {
          console.error("Error processing document personalization:", error);
          return { usedSegments: [], totalPersonalizedComponents: 0 };
        }
      };

    getDocumentPersonalization().then(setPersonalizationConfig);
  }, [currentDocument, client]);

  return (
    <AnalyticsPane
      document={analyticsDocument}
      personalizationConfig={personalizationConfig || undefined}
    />
  );
};
