"use client";

export function LocalTime({
  result,
}: {
  result: {
    city: string;
    timezone?: string;
    localTime: string;
    utcOffset?: string;
  };
}) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-sky-500/10 via-blue-500/10 to-indigo-500/10 p-4">
      <div className="mb-1 text-muted-foreground text-xs">Local Time</div>

      <div className="mb-1 font-medium text-foreground text-sm">
        {result.city}
      </div>

      <div className="font-light text-2xl text-foreground tracking-tight">
        {result.localTime}
      </div>

      {result.utcOffset && (
        <div className="mt-1 text-muted-foreground text-xs">
          {result.utcOffset}
        </div>
      )}
    </div>
  );
}
