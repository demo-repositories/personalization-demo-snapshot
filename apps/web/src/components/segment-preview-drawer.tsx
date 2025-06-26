"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useSegmentPreview } from "@/hooks/use-segment-preview";
import { client } from "@/lib/sanity/client";
import { queryPagePersonalizationSegments } from "@/lib/sanity/query";

interface Segment {
  _id: string;
  name: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
}

export function SegmentPreviewDrawer() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { previewSegmentId, setPreviewSegmentId } = useSegmentPreview();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchPageSegments() {
      try {
        let fetchedSegments: Segment[] = [];

        console.log("🔍 Fetching segments for path:", pathname);
        // Debug query to see what personalization data exists
        const debugQuery = `
          *[_type in ["homePage", "page"] && (
            _type == "homePage" && _id == "homePage" ||
            _type == "page" && slug.current == $slug
          )][0]{
            _type,
            title,
            "personalizedComponents": pageBuilder[defined(personalization)]{
              _type,
              "enabled": personalization.enabled,
              "variantCount": count(personalization.variants),
              "variants": personalization.variants[]{
                "segmentId": segment._ref,
                "segmentName": segment->name,
                "holdout": holdoutPercentage
              }
            }
          }
        `;

        if (pathname === "/") {
          fetchedSegments = await client.fetch(
            queryPagePersonalizationSegments,
            {},
          );
          const debugData = await client.fetch(debugQuery, {});
          console.log("🔍 Debug data for homepage:", debugData);
        } else {
          const slug = pathname.startsWith("/") ? pathname.slice(1) : pathname;
          console.log("🔍 Fetching with slug:", `/${slug}`);
          fetchedSegments = await client.fetch(
            queryPagePersonalizationSegments,
            { slug: `/${slug}` },
          );
          const debugData = await client.fetch(debugQuery, {
            slug: `/${slug}`,
          });
          console.log("🔍 Debug data for page:", debugData);
        }

        console.log("📊 Raw fetched segments:", fetchedSegments);

        // Filter out inactive segments and ensure we have valid data
        const activeSegments = (fetchedSegments || []).filter(
          (segment) => segment && segment._id && segment.status === "active",
        );

        console.log("✅ Active segments:", activeSegments);

        const sortedSegments = activeSegments.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return (a.title || a.name || "").localeCompare(
            b.title || b.name || "",
          );
        });

        setSegments(sortedSegments);
      } catch (error) {
        console.error("❌ Error fetching segments:", error);
        setSegments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPageSegments();
  }, [pathname]);

  const activeSegment = segments.find((seg) => seg._id === previewSegmentId);

  console.log("previewSegmentId:", JSON.stringify(previewSegmentId));
  console.log(
    "segment IDs:",
    segments.map((s) => JSON.stringify(s._id)),
  );

  return (
    <>
      {/* Floating Personalization Icon */}
      <div className="fixed top-4 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex">
            <span className="text-sm text-muted-foreground flex items-center justify-center mr-4">
              Selected Segment:
            </span>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm shadow-lg border-2 border-zinc-200 dark:border-zinc-700hover:bg-white dark:hover:bg-zinc-800 flex items-center gap-2 max-w-48 text-zinc-900 dark:text-zinc-100"
              >
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline truncate">
                  {previewSegmentId
                    ? activeSegment?.title || activeSegment?.name || "Unknown"
                    : "Default"}
                </span>
              </Button>
            </SheetTrigger>
          </div>

          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Segment Preview
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-4">
              <div className="text-sm text-muted-foreground">
                Preview personalized content for different audience segments on
                this page.
              </div>

              {loading ? (
                <div className="text-sm text-muted-foreground">
                  Loading segments...
                </div>
              ) : segments.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium">Available Segments:</div>

                  {/* Default Option */}
                  <Button
                    variant={!previewSegmentId ? "default" : "outline"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => {
                      setPreviewSegmentId(null);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex flex-col items-start w-full min-w-0">
                      <span className="font-medium text-left truncate w-full">
                        Default Content
                      </span>
                    </div>
                  </Button>

                  {/* Segment Options */}
                  {segments.map((segment) => (
                    <Button
                      key={segment._id}
                      variant={
                        previewSegmentId === segment._id ? "default" : "outline"
                      }
                      className="w-full justify-start p-3"
                      onClick={() => {
                        setPreviewSegmentId(segment._id);
                        setIsOpen(false);
                      }}
                    >
                      <span className="font-medium text-left truncate w-full">
                        {segment.title || segment.name}
                      </span>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                  No personalized segments are configured for components on this
                  page.
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
