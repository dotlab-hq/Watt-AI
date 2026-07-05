"use client";

export function UnitConverter({
  result,
}: {
  result:
    | { value: number; from: string; to: string; result: number }
    | { error: string };
}) {
  if ("error" in result) {
    return (
      <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/30 p-4">
        <div className="mb-2 text-muted-foreground text-xs">Unit Converter</div>
        <div className="text-destructive text-sm">{result.error}</div>
      </div>
    );
  }

  const fmt = (val: number) =>
    val.toLocaleString(undefined, { maximumFractionDigits: 6 });

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-4">
      <div className="mb-3 text-muted-foreground text-xs">Unit Converter</div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="mb-1 text-muted-foreground text-xs">{result.from}</div>
          <div className="font-light text-2xl text-foreground">
            {fmt(result.value)}
          </div>
        </div>

        <div className="shrink-0 text-muted-foreground text-xl">→</div>

        <div className="flex-1 text-right">
          <div className="mb-1 text-muted-foreground text-xs">{result.to}</div>
          <div className="font-light text-2xl text-blue-600 dark:text-blue-400">
            {fmt(result.result)}
          </div>
        </div>
      </div>
    </div>
  );
}
