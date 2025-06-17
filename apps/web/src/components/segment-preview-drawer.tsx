"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { client } from "@/lib/sanity/client";
import { queryPagePersonalizationSegments } from "@/lib/sanity/query";
import { useSegmentPreview } from "@/hooks/use-segment-preview";
import { Button } from "@workspace/ui/components/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@workspace/ui/components/sheet";
import { Users } from "lucide-react";

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
        
        if (pathname === '/') {
          fetchedSegments = await client.fetch(queryPagePersonalizationSegments, {});
        } else {
          const slug = pathname.startsWith('/') ? pathname.slice(1) : pathname;
          fetchedSegments = await client.fetch(queryPagePersonalizationSegments, { slug: `/${slug}` });
        }
        
        const sortedSegments = (fetchedSegments || []).sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        });
        
        setSegments(sortedSegments);
      } catch (error) {
        setSegments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPageSegments();
  }, [pathname]);

  const activeSegment = segments.find(seg => seg._id === previewSegmentId);

  return (
    <>
      {/* Floating Personalization Icon */}
      <div className="fixed top-4 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-lg border-2 hover:bg-white flex items-center gap-2 max-w-48"
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline truncate">
                {previewSegmentId ? 
                  (activeSegment?.title || activeSegment?.name || 'Unknown') : 
                  'Default'
                }
              </span>
            </Button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Segment Preview
              </SheetTitle>
            </SheetHeader>
            
            <div className="mt-6 space-y-4">
              <div className="text-sm text-muted-foreground">
                Preview personalized content for different audience segments on this page.
              </div>
              
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading segments...</div>
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
                      <span className="font-medium text-left truncate w-full">Default Content</span>
                    </div>
                  </Button>
                  
                  {/* Segment Options */}
                  {segments.map((segment) => (
                    <Button
                      key={segment._id}
                      variant={previewSegmentId === segment._id ? "default" : "outline"}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => {
                        setPreviewSegmentId(segment._id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex flex-col items-start w-full min-w-0">
                        <span className="font-medium text-left truncate w-full">
                          {segment.title || segment.name}
                        </span>
                        {segment.description && (
                          <span className="text-xs text-muted-foreground text-left mt-1 line-clamp-2 break-words">
                            {segment.description}
                          </span>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                  No personalized segments are configured for components on this page.
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
} 