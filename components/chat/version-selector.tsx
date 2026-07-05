"use client";

import { formatDistance } from "date-fns";
import { Check, ChevronDown } from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Document } from "@/lib/db/schema";

export function VersionSelector({
  documents,
  currentVersionIndex,
  onVersionChange,
}: {
  documents: Document[];
  currentVersionIndex: number;
  onVersionChange: Dispatch<SetStateAction<number>>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (documents.length <= 1) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium tabular-nums text-muted-foreground transition-colors hover:bg-muted/80"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        v{currentVersionIndex + 1}/{documents.length}
        <ChevronDown
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          size={12}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-60 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          <div className="p-1.5">
            <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Versions
            </div>
            {documents.map((doc, index) => (
              <button
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                  index === currentVersionIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/50"
                }`}
                key={doc.createdAt.toISOString()}
                onClick={() => {
                  onVersionChange(index);
                  setIsOpen(false);
                }}
                type="button"
              >
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                  {index === currentVersionIndex ? (
                    <Check className="text-foreground" size={12} />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <span className="truncate text-xs font-medium">
                    {doc.title || `Version ${index + 1}`}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistance(new Date(doc.createdAt), new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                {index === documents.length - 1 && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                    Latest
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
