"use client";

import { Brain, ChevronDownIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useArtifact } from "@/hooks/use-artifact";
import { cn } from "@/lib/utils";

interface SubagentWorkProps {
  isStreaming?: boolean;
  content?: string;
  defaultOpen?: boolean;
  className?: string;
}

export function SubagentWork({
  isStreaming = false,
  content,
  defaultOpen = false,
  className,
}: SubagentWorkProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hasBeenStreaming, setHasBeenStreaming] = useState(isStreaming);
  const { setArtifact } = useArtifact();

  useEffect(() => {
    if (isStreaming) {
      setHasBeenStreaming(true);
      setIsOpen(true);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (content && isStreaming) {
      // Extract content from subagent and create artifact if needed
      const lowerContent = content.toLowerCase();

      if (
        lowerContent.includes("research") ||
        lowerContent.includes("web search")
      ) {
        // Auto-create text artifact from research results
        setArtifact({
          kind: "text",
          mode: "create",
          content,
          title: "Research Results",
        });
      }
    }
  }, [content, isStreaming, setArtifact]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Collapsible
      className={cn(
        "group not-prose mb-4 w-full rounded-md border bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
        className
      )}
      onOpenChange={handleOpenChange}
      open={isOpen}
    >
      <CollapsibleTrigger className="w-full">
        <div className="flex w-full items-center justify-between p-3">
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <Loader2 className="size-4 animate-spin text-blue-600" />
            ) : (
              <Brain className="size-4 text-blue-600" />
            )}
            <span className="font-medium text-sm text-blue-900 dark:text-blue-100">
              Subagent Work - Research
            </span>
            {isStreaming && (
              <span className="ml-2 text-xs text-blue-600 animate-pulse">
                Processing...
              </span>
            )}
          </div>
          <ChevronDownIcon className="size-4 text-blue-600 transition-transform group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="p-3 pt-0">
          {hasBeenStreaming && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-xs font-sans leading-relaxed text-blue-900 dark:text-blue-100">
                {content}
              </pre>
            </div>
          )}
          {isStreaming && !content && (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="size-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-600">
                Searching and analyzing...
              </span>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
