"use client";

export function Calculator({
  result,
}: {
  result: { expression: string; result: number } | { error: string };
}) {
  if ("error" in result) {
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/30 p-4">
        <div className="mb-2 text-muted-foreground text-xs">Calculator</div>
        <div className="text-destructive text-sm">{result.error}</div>
      </div>
    );
  }

  const formatted = Number.isInteger(result.result)
    ? result.result.toLocaleString()
    : result.result.toLocaleString(undefined, { maximumFractionDigits: 10 });

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10 p-4">
      <div className="mb-1 text-muted-foreground text-xs">Calculator</div>
      <div className="font-mono text-muted-foreground text-xs line-through opacity-60">
        {result.expression}
      </div>
      <div className="mt-1 font-light text-3xl text-foreground tracking-tight">
        {formatted}
      </div>
    </div>
  );
}
