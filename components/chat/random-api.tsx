"use client";

import { ChevronDownIcon, ExternalLinkIcon, GlobeIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export type HttpRequest = {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: string | null;
};

export type HttpResponse<T = unknown> = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: T;
};

export type HttpResult = {
  request: HttpRequest;
  response?: HttpResponse;
  error?: string;
  ok?: boolean;
};

function StatusBadge({ status, ok }: { status: number; ok: boolean }) {
  const color = ok ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}

function HeadersViewer({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers);
  return entries.length > 0 ? (
    <div className="mt-2">
      <h5 className="text-xs font-medium text-muted-foreground uppercase">
        Headers
      </h5>
      <div className="mt-1 max-h-32 overflow-y-auto rounded-md bg-muted/30 p-2 text-xs">
        {entries.map(([key, value]) => (
          <div className="font-mono" key={key}>
            <span className="text-foreground">{key}</span>:{" "}
            <span className="text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  ) : null;
}

function BodyViewer({ body }: { body: unknown }) {
  if (body === null || body === undefined) {
    return null;
  }

  const content =
    typeof body === "string" ? body : JSON.stringify(body, null, 2);
  const truncated =
    content.length > 2000
      ? `${content.slice(0, 2000)}\n... (truncated)`
      : content;

  return (
    <div className="mt-2">
      <h5 className="text-xs font-medium text-muted-foreground uppercase">
        Body
      </h5>
      <pre className="mt-1 max-h-48 overflow-y-auto rounded-md bg-muted/30 p-2 text-xs">
        {truncated}
      </pre>
    </div>
  );
}

export function RandomApi({ result }: { result: HttpResult }) {
  const { request, response, error, ok } = result;
  const hasResponse = response !== undefined;

  return (
    <div className="w-[min(100%,500px)] rounded-lg border border-border/40 bg-card">
      <Collapsible className="w-full" defaultOpen>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-3 text-left">
          <div className="flex items-center gap-2">
            <GlobeIcon className="size-4 text-muted-foreground" />
            <span className="font-medium text-sm">{request.method}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {request.url}
            </span>
          </div>
          {hasResponse && (
            <div className="flex items-center gap-2">
              <StatusBadge ok={ok ?? false} status={response.status} />
              <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </div>
          )}
          {error && <span className="text-xs text-red-500">Error</span>}
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t px-3 pb-3">
          <div className="mt-3 space-y-3">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase">
                Request
              </h4>
              <pre className="mt-1 text-xs">
                {JSON.stringify(request, null, 2)}
              </pre>
            </div>
            {hasResponse && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase">
                  Response
                </h4>
                <HeadersViewer headers={response.headers} />
                <BodyViewer body={response.body} />
              </div>
            )}
            {error && (
              <div>
                <h4 className="text-xs font-medium text-red-600 uppercase">
                  Error
                </h4>
                <pre className="mt-1 text-xs text-red-500">{error}</pre>
              </div>
            )}
            {request.url && (
              <a
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                href={request.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLinkIcon className="size-3" />
                Open in browser
              </a>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
